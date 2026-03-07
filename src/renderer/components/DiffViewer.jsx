import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { parseDiff } from '../utils/parseDiff';
import { getLanguage, highlightLine } from '../utils/highlight';
import CommentInput from './CommentInput';
import CommentDisplay from './CommentDisplay';
import 'highlight.js/styles/github-dark.css';
import styles from './DiffViewer.module.css';

const PREFIX_MAP = { addition: '+', deletion: '-', context: ' ' };

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function Hunk({ hunk, hunkIdx, language, activeComment, selectedLineIds, fileComments, onLineMouseDown, onLineMouseEnter, onSaveComment, onCancelComment, onEditComment, onDeleteComment }) {
  const [collapsed, setCollapsed] = useState(false);

  const commentedLineIds = useMemo(() => {
    const ids = new Set();
    (fileComments || []).forEach((c) => c.lineIds.forEach((id) => ids.add(id)));
    return ids;
  }, [fileComments]);

  return (
    <div className={styles.hunk}>
      <button
        className={styles.hunkHeader}
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
      >
        <span className={styles.collapseArrow}>{collapsed ? '\u25B6' : '\u25BC'}</span>
        {hunk.header}
      </button>
      {!collapsed && (
        <table className={styles.table}>
          <tbody>
            {hunk.lines.map((line, lineIdx) => {
              const lineId = `${hunkIdx}-${lineIdx}`;
              const isActive = activeComment && activeComment.lineIds.includes(lineId);
              const isSelected = selectedLineIds && selectedLineIds.has(lineId);
              const isCommented = commentedLineIds.has(lineId);

              const rowClasses = [
                styles.lineRow,
                styles[line.type],
                isSelected ? styles.selected : '',
                isCommented ? styles.commented : '',
              ].filter(Boolean).join(' ');

              const gutterProps = {
                onMouseDown: (e) => { e.preventDefault(); onLineMouseDown(hunkIdx, lineIdx, line, e); },
                onMouseEnter: () => onLineMouseEnter(hunkIdx, lineIdx, line),
              };

              return [
                <tr
                  key={lineIdx}
                  className={rowClasses}
                >
                  <td className={styles.lineNum} {...gutterProps}>
                    {line.oldNum ?? ''}
                  </td>
                  <td className={styles.lineNum} {...gutterProps}>
                    {line.newNum ?? ''}
                  </td>
                  <td className={styles.prefix} {...gutterProps}>
                    {PREFIX_MAP[line.type]}
                  </td>
                  <td
                    className={styles.content}
                    dangerouslySetInnerHTML={
                      language
                        ? { __html: highlightLine(line.content, language) || escapeHtml(line.content) }
                        : undefined
                    }
                  >
                    {language ? undefined : line.content}
                  </td>
                </tr>,
                isActive && !activeComment.editId && activeComment.lineIds[activeComment.lineIds.length - 1] === lineId && (
                  <tr key={`comment-input-${lineIdx}`} className={styles.commentRow}>
                    <td colSpan={4}>
                      <CommentInput
                        onSave={onSaveComment}
                        onCancel={onCancelComment}
                      />
                    </td>
                  </tr>
                ),
                ...(fileComments || [])
                  .filter((c) => c.lineIds[c.lineIds.length - 1] === lineId)
                  .map((c) => (
                    <tr key={`display-${c.id}`} className={styles.commentRow}>
                      <td colSpan={4}>
                        {activeComment && activeComment.editId === c.id ? (
                          <CommentInput
                            initialText={activeComment.initialText}
                            onSave={onSaveComment}
                            onCancel={onCancelComment}
                          />
                        ) : (
                          <CommentDisplay
                            comment={c}
                            onEdit={onEditComment}
                            onDelete={onDeleteComment}
                          />
                        )}
                      </td>
                    </tr>
                  )),
              ];
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function DiffViewer({ repoPath, filePath, refreshKey, comments, onAddComment, onUpdateComment, onDeleteComment }) {
  const [hunks, setHunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeComment, setActiveComment] = useState(null);
  const [selectedLineIds, setSelectedLineIds] = useState(new Set());
  const language = useMemo(() => filePath ? getLanguage(filePath) : null, [filePath]);
  const dragRef = useRef(null); // { hunkIdx, anchorIdx, currentIdx }

  const fileComments = useMemo(
    () => (comments || []).filter((c) => c.filePath === filePath),
    [comments, filePath]
  );

  useEffect(() => {
    async function loadDiff() {
      if (!repoPath || !filePath) {
        setHunks([]);
        return;
      }
      setLoading(true);
      const raw = await window.electronAPI.getFileDiff(repoPath, filePath);
      const files = parseDiff(raw);
      const allHunks = files.flatMap((f) => f.hunks);
      setHunks(allHunks);
      setLoading(false);
    }
    loadDiff();
  }, [repoPath, filePath, refreshKey]);

  // Clear active comment when file changes
  useEffect(() => {
    setActiveComment(null);
    dragRef.current = null;
    setSelectedLineIds(new Set());
  }, [filePath]);

  const buildLineId = (hIdx, lIdx) => `${hIdx}-${lIdx}`;

  const buildSelectionRange = useCallback((hunkIdx, startIdx, endIdx) => {
    const hunk = hunks[hunkIdx];
    const lo = Math.min(startIdx, endIdx);
    const hi = Math.max(startIdx, endIdx);

    const lineIds = [];
    const codeLines = [];
    let firstNum = null;
    let lastNum = null;

    for (let i = lo; i <= hi; i++) {
      lineIds.push(buildLineId(hunkIdx, i));
      codeLines.push(hunk.lines[i].content);
      const num = hunk.lines[i].newNum ?? hunk.lines[i].oldNum;
      if (num != null) {
        if (firstNum === null) firstNum = num;
        lastNum = num;
      }
    }

    const lineNum = firstNum === lastNum ? String(firstNum) : `${firstNum}-${lastNum}`;
    return { lineIds, lineNum, code: codeLines.join('\n'), type: hunk.lines[hi].type };
  }, [hunks]);

  const lastAnchorRef = useRef(null);

  const handleLineMouseDown = useCallback((hunkIdx, lineIdx, _line, event) => {
    if (event && event.shiftKey && lastAnchorRef.current && lastAnchorRef.current.hunkIdx === hunkIdx) {
      // Shift+click: immediately select range from last anchor, no drag
      const sel = buildSelectionRange(hunkIdx, lastAnchorRef.current.lineIdx, lineIdx);
      setSelectedLineIds(new Set(sel.lineIds));
      setActiveComment(sel);
      dragRef.current = null;
      return;
    }

    lastAnchorRef.current = { hunkIdx, lineIdx };
    dragRef.current = { hunkIdx, anchorIdx: lineIdx, currentIdx: lineIdx };
    const lineId = buildLineId(hunkIdx, lineIdx);
    setSelectedLineIds(new Set([lineId]));
    setActiveComment(null);
  }, [buildSelectionRange]);

  const handleLineMouseEnter = useCallback((hunkIdx, lineIdx) => {
    const drag = dragRef.current;
    if (!drag || drag.hunkIdx !== hunkIdx) return;
    drag.currentIdx = lineIdx;

    const lo = Math.min(drag.anchorIdx, lineIdx);
    const hi = Math.max(drag.anchorIdx, lineIdx);
    const ids = new Set();
    for (let i = lo; i <= hi; i++) {
      ids.add(buildLineId(hunkIdx, i));
    }
    setSelectedLineIds(ids);
  }, []);

  // Finalize selection on mouseup
  useEffect(() => {
    function handleMouseUp() {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;

      const { hunkIdx, anchorIdx, currentIdx } = drag;
      const sel = buildSelectionRange(hunkIdx, anchorIdx, currentIdx);
      setActiveComment(sel);
    }
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [buildSelectionRange]);

  const clearSelection = () => {
    setActiveComment(null);
    dragRef.current = null;
    setSelectedLineIds(new Set());
  };

  const handleEditComment = (comment) => {
    setActiveComment({
      editId: comment.id,
      lineIds: comment.lineIds,
      initialText: comment.text,
    });
  };

  const handleSaveComment = (text) => {
    if (activeComment && activeComment.editId) {
      onUpdateComment(activeComment.editId, text);
    } else if (activeComment && onAddComment) {
      onAddComment({
        filePath,
        lineIds: activeComment.lineIds,
        lineNum: activeComment.lineNum,
        code: activeComment.code,
        text,
      });
    }
    clearSelection();
  };

  const handleCancelComment = () => {
    clearSelection();
  };

  if (!filePath) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Select a file to view its diff</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Loading diff...</div>
      </div>
    );
  }

  if (hunks.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>No diff available for this file</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {hunks.map((hunk, hunkIdx) => (
        <Hunk
          key={hunkIdx}
          hunk={hunk}
          hunkIdx={hunkIdx}
          language={language}
          activeComment={activeComment}
          selectedLineIds={selectedLineIds}
          fileComments={fileComments}
          onLineMouseDown={handleLineMouseDown}
          onLineMouseEnter={handleLineMouseEnter}
          onSaveComment={handleSaveComment}
          onCancelComment={handleCancelComment}
          onEditComment={handleEditComment}
          onDeleteComment={onDeleteComment}
        />
      ))}
    </div>
  );
}

export default DiffViewer;

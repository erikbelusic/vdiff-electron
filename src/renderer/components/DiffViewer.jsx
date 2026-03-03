import { useState, useEffect, useMemo } from 'react';
import { parseDiff } from '../utils/parseDiff';
import { getLanguage, highlightLine } from '../utils/highlight';
import CommentInput from './CommentInput';
import 'highlight.js/styles/github-dark.css';
import styles from './DiffViewer.module.css';

const PREFIX_MAP = { addition: '+', deletion: '-', context: ' ' };

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function Hunk({ hunk, hunkIdx, language, activeComment, selectedLineIds, onLineClick, onSaveComment, onCancelComment }) {
  const [collapsed, setCollapsed] = useState(false);

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

              const rowClasses = [
                styles.lineRow,
                styles[line.type],
                isSelected ? styles.selected : '',
              ].filter(Boolean).join(' ');

              return [
                <tr
                  key={lineIdx}
                  className={rowClasses}
                  onClick={(e) => onLineClick(hunkIdx, lineIdx, line, e)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className={styles.lineNum}>
                    {line.oldNum ?? ''}
                  </td>
                  <td className={styles.lineNum}>
                    {line.newNum ?? ''}
                  </td>
                  <td className={styles.prefix}>
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
                isActive && activeComment.lineIds[activeComment.lineIds.length - 1] === lineId && (
                  <tr key={`comment-${lineIdx}`} className={styles.commentRow}>
                    <td colSpan={4}>
                      <CommentInput
                        onSave={onSaveComment}
                        onCancel={onCancelComment}
                      />
                    </td>
                  </tr>
                ),
              ];
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function DiffViewer({ repoPath, filePath, comments, onAddComment, onUpdateComment, onDeleteComment }) {
  const [hunks, setHunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeComment, setActiveComment] = useState(null);
  const [selectionAnchor, setSelectionAnchor] = useState(null);
  const [selectedLineIds, setSelectedLineIds] = useState(new Set());
  const language = useMemo(() => filePath ? getLanguage(filePath) : null, [filePath]);

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
  }, [repoPath, filePath]);

  // Clear active comment when file changes
  useEffect(() => {
    setActiveComment(null);
    setSelectionAnchor(null);
    setSelectedLineIds(new Set());
  }, [filePath]);

  const buildLineId = (hIdx, lIdx) => `${hIdx}-${lIdx}`;

  const handleLineClick = (hunkIdx, lineIdx, line, event) => {
    if (event.shiftKey && selectionAnchor && selectionAnchor.hunkIdx === hunkIdx) {
      // Shift+click: select range within same hunk
      const startIdx = Math.min(selectionAnchor.lineIdx, lineIdx);
      const endIdx = Math.max(selectionAnchor.lineIdx, lineIdx);
      const hunk = hunks[hunkIdx];

      const lineIds = [];
      const codeLines = [];
      let firstNum = null;
      let lastNum = null;

      for (let i = startIdx; i <= endIdx; i++) {
        lineIds.push(buildLineId(hunkIdx, i));
        codeLines.push(hunk.lines[i].content);
        const num = hunk.lines[i].newNum ?? hunk.lines[i].oldNum;
        if (num != null) {
          if (firstNum === null) firstNum = num;
          lastNum = num;
        }
      }

      const lineNum = firstNum === lastNum ? String(firstNum) : `${firstNum}-${lastNum}`;

      setSelectedLineIds(new Set(lineIds));
      setActiveComment({
        lineIds,
        lineNum,
        code: codeLines.join('\n'),
        type: line.type,
      });
    } else {
      // Normal click: single line
      const lineId = buildLineId(hunkIdx, lineIdx);
      const lineNum = line.newNum ?? line.oldNum ?? '';
      setSelectionAnchor({ hunkIdx, lineIdx });
      setSelectedLineIds(new Set([lineId]));
      setActiveComment({
        lineIds: [lineId],
        lineNum: String(lineNum),
        code: line.content,
        type: line.type,
      });
    }
  };

  const clearSelection = () => {
    setActiveComment(null);
    setSelectionAnchor(null);
    setSelectedLineIds(new Set());
  };

  const handleSaveComment = (text) => {
    if (activeComment && onAddComment) {
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
          onLineClick={handleLineClick}
          onSaveComment={handleSaveComment}
          onCancelComment={handleCancelComment}
        />
      ))}
    </div>
  );
}

export default DiffViewer;

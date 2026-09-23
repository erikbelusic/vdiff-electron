import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { parseDiff } from '../utils/parseDiff';
import { getLanguage, highlightLine } from '../utils/highlight';
import CommentInput from './CommentInput';
import CommentDisplay from './CommentDisplay';
import FindBar from './FindBar';
import { findMatches } from '../utils/findMatches';
import 'highlight.js/styles/github-dark.css';
import styles from './DiffViewer.module.css';

const PREFIX_MAP = { addition: '+', deletion: '-', context: ' ' };

// Builds a DOM Range over [start, end) of an element's text, spanning the
// syntax-highlighting spans it may be split across.
function textRange(el, start, end) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let offset = 0;
  let started = false;
  let node;
  while ((node = walker.nextNode())) {
    const len = node.textContent.length;
    if (!started && start < offset + len) {
      range.setStart(node, start - offset);
      started = true;
    }
    if (started && end <= offset + len) {
      range.setEnd(node, end - offset);
      return range;
    }
    offset += len;
  }
  return null;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function Hunk({ hunk, hunkIdx, collapsed, onToggleCollapsed, language, activeComment, selectedLineIds, fileComments, onLineMouseDown, onLineMouseEnter, onSaveComment, onCancelComment, onEditComment, onDeleteComment }) {
  const commentedLineIds = useMemo(() => {
    const ids = new Set();
    (fileComments || []).forEach((c) => c.lineIds.forEach((id) => ids.add(id)));
    return ids;
  }, [fileComments]);

  return (
    <div className={styles.hunk}>
      <button
        className={styles.hunkHeader}
        onClick={() => onToggleCollapsed(hunkIdx)}
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
                    data-line-id={lineId}
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

function DiffViewer({ repoPath, filePath, commit, refreshKey, comments, onAddComment, onUpdateComment, onDeleteComment }) {
  const [hunks, setHunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const prevFileRef = useRef(null);
  const [activeComment, setActiveComment] = useState(null);
  const [selectedLineIds, setSelectedLineIds] = useState(new Set());
  const language = useMemo(() => filePath ? getLanguage(filePath) : null, [filePath]);
  const dragRef = useRef(null); // { hunkIdx, anchorIdx, currentIdx }
  const scrollRef = useRef(null);
  const [collapsedHunks, setCollapsedHunks] = useState(new Set());
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findIndex, setFindIndex] = useState(0);
  const [findFocusKey, setFindFocusKey] = useState(0);
  const pendingScrollRef = useRef(false);

  const matches = useMemo(() => findMatches(hunks, findQuery), [hunks, findQuery]);
  const currentMatchIdx = matches.length ? Math.min(findIndex, matches.length - 1) : 0;

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
      const isNewFile = prevFileRef.current !== filePath;
      if (isNewFile) setLoading(true);
      prevFileRef.current = filePath;
      const raw = commit
        ? await window.electronAPI.getCommitFileDiff(repoPath, commit, filePath)
        : await window.electronAPI.getFileDiff(repoPath, filePath);
      const files = parseDiff(raw);
      const allHunks = files.flatMap((f) => f.hunks);
      setHunks(allHunks);
      setLoading(false);
    }
    loadDiff();
  }, [repoPath, filePath, commit, refreshKey]);

  // Clear active comment when file changes
  useEffect(() => {
    setActiveComment(null);
    dragRef.current = null;
    setSelectedLineIds(new Set());
    setCollapsedHunks(new Set());
    setFindIndex(0);
  }, [filePath]);

  const toggleCollapsed = useCallback((hunkIdx) => {
    setCollapsedHunks((prev) => {
      const next = new Set(prev);
      if (next.has(hunkIdx)) next.delete(hunkIdx); else next.add(hunkIdx);
      return next;
    });
  }, []);

  // Jump to a match: expand its hunk if collapsed, then scroll to it after render
  const goToMatch = useCallback((index, matchList) => {
    if (matchList.length === 0) return;
    const wrapped = (index + matchList.length) % matchList.length;
    const { hunkIdx } = matchList[wrapped];
    setFindIndex(wrapped);
    setCollapsedHunks((prev) => {
      if (!prev.has(hunkIdx)) return prev;
      const next = new Set(prev);
      next.delete(hunkIdx);
      return next;
    });
    pendingScrollRef.current = true;
  }, []);

  const handleFindQueryChange = (query) => {
    setFindQuery(query);
    setFindIndex(0);
    goToMatch(0, findMatches(hunks, query));
  };
  const handleFindNext = useCallback(() => goToMatch(currentMatchIdx + 1, matches), [goToMatch, currentMatchIdx, matches]);
  const handleFindPrev = useCallback(() => goToMatch(currentMatchIdx - 1, matches), [goToMatch, currentMatchIdx, matches]);

  // ⌘F opens find; ⌘G / ⌘⇧G step through matches
  useEffect(() => {
    function handleKeyDown(e) {
      if (!e.metaKey || !filePath) return;
      const key = e.key.toLowerCase();
      if (key === 'f' && !e.shiftKey) {
        e.preventDefault();
        setFindOpen(true);
        setFindFocusKey((k) => k + 1);
      } else if (key === 'g' && findOpen) {
        e.preventDefault();
        if (e.shiftKey) handleFindPrev(); else handleFindNext();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filePath, findOpen, handleFindNext, handleFindPrev]);

  // Paint matches with the CSS Custom Highlight API (no DOM mutation, so it
  // coexists with syntax highlighting and React's rendering)
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || typeof CSS === 'undefined' || !CSS.highlights) return;
    const all = [];
    let current = null;
    if (findOpen && matches.length > 0) {
      const cells = new Map();
      container.querySelectorAll('[data-line-id]').forEach((el) => cells.set(el.dataset.lineId, el));
      matches.forEach((m, i) => {
        const cell = cells.get(`${m.hunkIdx}-${m.lineIdx}`);
        const range = cell && textRange(cell, m.start, m.end);
        if (!range) return;
        all.push(range);
        if (i === currentMatchIdx) current = range;
      });
    }
    CSS.highlights.set('find-match', new Highlight(...all));
    CSS.highlights.set('find-current', current ? new Highlight(current) : new Highlight());

    if (pendingScrollRef.current && current) {
      pendingScrollRef.current = false;
      const rect = current.getBoundingClientRect();
      const box = container.getBoundingClientRect();
      if (rect.top < box.top || rect.bottom > box.bottom) {
        container.scrollTop += rect.top - box.top - box.height / 2;
      }
    }
  });

  useEffect(() => () => {
    if (typeof CSS === 'undefined' || !CSS.highlights) return;
    CSS.highlights.delete('find-match');
    CSS.highlights.delete('find-current');
  }, []);

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
    <div className={styles.wrapper}>
      {findOpen && (
        <FindBar
          query={findQuery}
          onQueryChange={handleFindQueryChange}
          matchCount={matches.length}
          currentIndex={currentMatchIdx}
          onNext={handleFindNext}
          onPrev={handleFindPrev}
          onClose={() => setFindOpen(false)}
          focusKey={findFocusKey}
        />
      )}
      <div className={styles.container} ref={scrollRef}>
      {hunks.map((hunk, hunkIdx) => (
        <Hunk
          key={hunkIdx}
          hunk={hunk}
          hunkIdx={hunkIdx}
          collapsed={collapsedHunks.has(hunkIdx)}
          onToggleCollapsed={toggleCollapsed}
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
    </div>
  );
}

export default DiffViewer;

import { useState, useEffect, useMemo } from 'react';
import { parseDiff } from '../utils/parseDiff';
import { getLanguage, highlightLine } from '../utils/highlight';
import 'highlight.js/styles/github-dark.css';
import styles from './DiffViewer.module.css';

const PREFIX_MAP = { addition: '+', deletion: '-', context: ' ' };

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function Hunk({ hunk, language }) {
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
            {hunk.lines.map((line, lineIdx) => (
              <tr
                key={lineIdx}
                className={`${styles.lineRow} ${styles[line.type]}`}
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function DiffViewer({ repoPath, filePath }) {
  const [hunks, setHunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const language = useMemo(() => filePath ? getLanguage(filePath) : null, [filePath]);

  useEffect(() => {
    async function loadDiff() {
      if (!repoPath || !filePath) {
        setHunks([]);
        return;
      }
      setLoading(true);
      const raw = await window.electronAPI.getFileDiff(repoPath, filePath);
      const files = parseDiff(raw);
      // Combine hunks from all parsed file entries (there may be staged + unstaged)
      const allHunks = files.flatMap((f) => f.hunks);
      setHunks(allHunks);
      setLoading(false);
    }
    loadDiff();
  }, [repoPath, filePath]);

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
        <Hunk key={hunkIdx} hunk={hunk} language={language} />
      ))}
    </div>
  );
}

export default DiffViewer;

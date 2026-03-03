import { useState, useEffect } from 'react';
import { parseDiff } from '../utils/parseDiff';
import styles from './DiffViewer.module.css';

const PREFIX_MAP = { addition: '+', deletion: '-', context: ' ' };

function DiffViewer({ repoPath, filePath }) {
  const [hunks, setHunks] = useState([]);
  const [loading, setLoading] = useState(false);

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
        <div key={hunkIdx} className={styles.hunk}>
          <div className={styles.hunkHeader}>{hunk.header}</div>
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
                  <td className={styles.content}>{line.content}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default DiffViewer;

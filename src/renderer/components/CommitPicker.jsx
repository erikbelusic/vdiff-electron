import { useState, useRef, useEffect } from 'react';
import styles from './CommitPicker.module.css';

function CommitPicker({ repoPath, currentBranch, selectedCommit, onSelectCommit }) {
  const [isOpen, setIsOpen] = useState(false);
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function open() {
    if (!isOpen && repoPath) {
      setLoading(true);
      const list = await window.electronAPI.getRecentCommits(repoPath);
      setCommits(list);
      setLoading(false);
    }
    setIsOpen(!isOpen);
  }

  function selectCommit(sha) {
    onSelectCommit(sha);
    setIsOpen(false);
  }

  const selectedCommitInfo = selectedCommit ? commits.find((c) => c.hash === selectedCommit) : null;

  return (
    <div className={styles.picker} ref={pickerRef}>
      <button
        className={styles.badge}
        onClick={open}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={styles.branchIcon}>&#9741;</span>
        {selectedCommit ? (
          <span className={styles.commitLabel}>
            {selectedCommitInfo?.shortHash ?? selectedCommit.slice(0, 7)}
            {selectedCommitInfo ? ` · ${selectedCommitInfo.subject}` : ''}
          </span>
        ) : (
          <span>{currentBranch}</span>
        )}
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          <button
            className={`${styles.item} ${styles.workingItem} ${!selectedCommit ? styles.selected : ''}`}
            role="option"
            aria-selected={!selectedCommit}
            onClick={() => selectCommit(null)}
          >
            Working Changes
          </button>
          <div className={styles.commitList}>
            {loading && <div className={styles.status}>Loading commits...</div>}
            {!loading && commits.length === 0 && (
              <div className={styles.status}>No commits found</div>
            )}
            {!loading && commits.map((commit) => {
              const isSelected = commit.hash === selectedCommit;
              return (
                <button
                  key={commit.hash}
                  className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  title={commit.subject}
                  onClick={() => selectCommit(commit.hash)}
                >
                  <span className={styles.commitHash}>{commit.shortHash}</span>
                  <span className={styles.commitSubject}>{commit.subject}</span>
                  <span className={styles.commitDate}>{commit.relativeDate}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default CommitPicker;

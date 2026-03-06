import { useState, useRef, useEffect } from 'react';
import styles from './RepositoryPicker.module.css';

function getRepoName(repoPath) {
  return repoPath.split('/').pop();
}

function RepositoryPicker({ repositories, selectedRepo, onSelectRepo, onAddRepository, onRemoveRepository, disabledRepos = [] }) {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className={styles.picker} ref={pickerRef}>
      <button
        className={styles.currentRepo}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={styles.repoName}>
          {selectedRepo ? getRepoName(selectedRepo) : 'Select a repository'}
        </span>
        <span className={styles.arrow}>{isOpen ? '\u25B2' : '\u25BC'}</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.repoList}>
            {repositories.map((repo) => {
              const isDisabled = disabledRepos.includes(repo);
              return (
                <div
                  key={repo}
                  className={`${styles.repoItem} ${repo === selectedRepo ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`}
                  role="option"
                  aria-selected={repo === selectedRepo}
                  aria-disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    onSelectRepo(repo);
                    setIsOpen(false);
                  }}
                >
                  <span className={styles.repoItemName}>{getRepoName(repo)}</span>
                  <span className={styles.repoItemPath}>{repo}</span>
                  <button
                    className={styles.removeButton}
                    aria-label={`Remove ${getRepoName(repo)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRepository(repo);
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
          <button
            className={styles.addRepoButton}
            onClick={() => {
              onAddRepository();
              setIsOpen(false);
            }}
          >
            + Add Repository
          </button>
        </div>
      )}
    </div>
  );
}

export default RepositoryPicker;

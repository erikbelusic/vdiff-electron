import { useEffect, useRef } from 'react';
import styles from './FindBar.module.css';

function FindBar({ query, onQueryChange, matchCount, currentIndex, onNext, onPrev, onClose, focusKey }) {
  const inputRef = useRef(null);

  // Re-focus and select the query every time find is invoked (⌘F), like a browser
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focusKey]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) onPrev(); else onNext();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  let status = '';
  if (query) status = matchCount === 0 ? 'No results' : `${currentIndex + 1} of ${matchCount}`;

  return (
    <div className={styles.bar} role="search">
      <input
        ref={inputRef}
        className={styles.input}
        type="text"
        placeholder="Find in diff"
        aria-label="Find in diff"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
      />
      <span className={`${styles.status} ${query && matchCount === 0 ? styles.noResults : ''}`}>{status}</span>
      <button className={styles.button} onClick={onPrev} disabled={matchCount === 0} aria-label="Previous match" title="Previous match (⇧Enter)">
        {'↑'}
      </button>
      <button className={styles.button} onClick={onNext} disabled={matchCount === 0} aria-label="Next match" title="Next match (Enter)">
        {'↓'}
      </button>
      <button className={styles.button} onClick={onClose} aria-label="Close find" title="Close (Esc)">
        {'×'}
      </button>
    </div>
  );
}

export default FindBar;

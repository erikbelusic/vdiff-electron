import styles from './ShortcutsDialog.module.css';

const SHORTCUTS = [
  { keys: '⌘T', description: 'New tab' },
  { keys: '⌘W', description: 'Close tab' },
  { keys: '⌘1–9', description: 'Switch to tab' },
  { keys: '⌘↑', description: 'Previous file' },
  { keys: '⌘↓', description: 'Next file' },
  { keys: '⌘E', description: 'Toggle export panel' },
  { keys: '⌘⇧C', description: 'Copy comments to clipboard' },
  { keys: '⌘,', description: 'Settings' },
  { keys: '⌘H', description: 'Keyboard shortcuts' },
  { keys: 'Esc', description: 'Close panel / dialog' },
];

function ShortcutsDialog({ onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} role="dialog" aria-labelledby="shortcuts-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="shortcuts-title" className={styles.title}>Keyboard Shortcuts</h2>
        <div className={styles.list}>
          {SHORTCUTS.map(({ keys, description }) => (
            <div key={keys} className={styles.row}>
              <kbd className={styles.keys}>{keys}</kbd>
              <span className={styles.description}>{description}</span>
            </div>
          ))}
        </div>
        <div className={styles.actions}>
          <button className={styles.closeBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ShortcutsDialog;

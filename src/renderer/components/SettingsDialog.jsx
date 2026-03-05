import { useState, useEffect, useRef } from 'react';
import styles from './SettingsDialog.module.css';

function SettingsDialog({ commentExpiryDays, onSave, onCancel }) {
  const [expiryDays, setExpiryDays] = useState(commentExpiryDays);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  function handleSubmit(e) {
    e.preventDefault();
    const value = Math.min(365, Math.max(1, Math.round(expiryDays)));
    onSave(value);
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} role="dialog" aria-labelledby="settings-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="settings-title" className={styles.title}>Settings</h2>
        <form onSubmit={handleSubmit}>
          <label className={styles.label}>
            Comment expiry (days)
            <input
              ref={inputRef}
              type="number"
              className={styles.input}
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              min={1}
              max={365}
            />
          </label>
          <p className={styles.hint}>
            Comments on branches not seen for this many days will be automatically removed.
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SettingsDialog;

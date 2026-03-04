import { useEffect, useRef } from 'react';
import styles from './ConfirmDialog.module.css';

function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} role="alertdialog" aria-labelledby="confirm-title" aria-describedby="confirm-message" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-title" className={styles.title}>{title}</h2>
        <p id="confirm-message" className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button ref={cancelRef} className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

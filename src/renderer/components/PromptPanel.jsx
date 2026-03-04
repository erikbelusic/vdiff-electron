import { useState, useMemo, useCallback } from 'react';
import { generateExport } from '../utils/exportComments';
import styles from './PromptPanel.module.css';

function PromptPanel({ comments, brief, onClose }) {
  const exportText = useMemo(() => generateExport(comments, { brief }), [comments, brief]);
  const [showToast, setShowToast] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(exportText).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    });
  }, [exportText]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Review Comments</h3>
        <div className={styles.actions}>
          {comments.length > 0 && (
            <button className={styles.copyBtn} onClick={handleCopy}>
              Copy to Clipboard
            </button>
          )}
          <button className={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className={styles.body}>
        <pre className={styles.content}>
          {comments.length === 0 ? (
            <span className={styles.noComments}>
              Click on any diff line to add a comment...
            </span>
          ) : (
            exportText
          )}
        </pre>
      </div>
      {showToast && (
        <div className={styles.toast}>Copied to clipboard!</div>
      )}
    </div>
  );
}

export default PromptPanel;

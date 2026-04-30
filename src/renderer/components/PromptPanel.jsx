import { useState, useMemo, useCallback } from 'react';
import { generateExport } from '../utils/exportComments';
import styles from './PromptPanel.module.css';

function PromptPanel({ comments, compact, generalComment, onClose }) {
  const exportText = useMemo(
    () => generateExport(comments, { compact, generalComment }),
    [comments, compact, generalComment]
  );
  const [showToast, setShowToast] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(exportText).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    });
  }, [exportText]);

  const hasOutput = exportText.length > 0;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Review Comments</h3>
        <div className={styles.actions}>
          {hasOutput && (
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
          {!hasOutput ? (
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

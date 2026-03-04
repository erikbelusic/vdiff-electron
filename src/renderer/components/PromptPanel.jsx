import { useMemo } from 'react';
import { generateExport } from '../utils/exportComments';
import styles from './PromptPanel.module.css';

function PromptPanel({ comments, onClose }) {
  const exportText = useMemo(() => generateExport(comments), [comments]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Review Comments</h3>
        <div className={styles.actions}>
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
    </div>
  );
}

export default PromptPanel;

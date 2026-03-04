import styles from './CommentDisplay.module.css';

function CommentDisplay({ comment, onEdit, onDelete }) {
  return (
    <div className={styles.commentDisplay}>
      <div className={styles.header}>
        <span className={styles.lineLabel}>Line {comment.lineNum}</span>
        <div className={styles.actions}>
          {onDelete && (
            <button
              className={styles.deleteBtn}
              onClick={() => onDelete(comment.id)}
              aria-label="Delete comment"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div
        className={styles.text}
        onClick={() => onEdit && onEdit(comment)}
      >
        {comment.text}
      </div>
    </div>
  );
}

export default CommentDisplay;

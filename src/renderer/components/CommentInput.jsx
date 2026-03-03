import { useState, useEffect, useRef } from 'react';
import styles from './CommentInput.module.css';

function CommentInput({ initialText = '', onSave, onCancel }) {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSave = () => {
    const trimmed = text.trim();
    if (trimmed) {
      onSave(trimmed);
    }
  };

  return (
    <div className={styles.commentInput}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a comment..."
        rows={3}
      />
      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button className={styles.saveBtn} onClick={handleSave} disabled={!text.trim()}>
          Save
        </button>
      </div>
    </div>
  );
}

export default CommentInput;

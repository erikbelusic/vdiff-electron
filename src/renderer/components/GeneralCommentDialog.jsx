import { useState, useEffect, useRef } from 'react';
import styles from './GeneralCommentDialog.module.css';

function GeneralCommentDialog({ value, onSave, onCancel }) {
  const [text, setText] = useState(value || '');
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
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
    onSave(text);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSave(text);
    }
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} role="dialog" aria-labelledby="general-comment-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="general-comment-title" className={styles.title}>General Comment</h2>
        <form onSubmit={handleSubmit}>
          <p className={styles.hint}>
            Appears at the top of the exported review, above the per-line feedback.
          </p>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={8}
            placeholder="Add overall feedback, context, or instructions..."
          />
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

export default GeneralCommentDialog;

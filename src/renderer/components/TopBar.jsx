import { useState } from 'react';
import RepositoryPicker from './RepositoryPicker';
import ConfirmDialog from './ConfirmDialog';
import styles from './TopBar.module.css';

function TopBar({ repositories, selectedRepo, onSelectRepo, onAddRepository, onRemoveRepository, currentBranch, commentCount, onTogglePromptPanel, promptPanelOpen, compactOutput, onToggleCompactOutput, onClearComments }) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div className={styles.topBar}>
      <RepositoryPicker
        repositories={repositories}
        selectedRepo={selectedRepo}
        onSelectRepo={onSelectRepo}
        onAddRepository={onAddRepository}
        onRemoveRepository={onRemoveRepository}
      />
      {currentBranch && (
        <div className={styles.branchBadge}>
          <span className={styles.branchIcon}>&#9741;</span>
          <span>{currentBranch}</span>
        </div>
      )}
      {commentCount > 0 && (
        <div className={styles.rightSection}>
          <label className={styles.compactToggle}>
            <input
              type="checkbox"
              checked={compactOutput}
              onChange={onToggleCompactOutput}
            />
            Compacted
          </label>
          <div className={styles.commentBadge}>
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </div>
          <button
            className={styles.clearBtn}
            onClick={() => setShowClearConfirm(true)}
          >
            Clear All
          </button>
          <button
            className={`${styles.promptBtn} ${promptPanelOpen ? styles.promptBtnActive : ''}`}
            onClick={onTogglePromptPanel}
          >
            Prompt Output
          </button>
        </div>
      )}
      {showClearConfirm && (
        <ConfirmDialog
          title="Clear all comments?"
          message={`This will delete all ${commentCount} comment${commentCount === 1 ? '' : 's'}. This cannot be undone.`}
          confirmLabel="Clear All"
          onConfirm={() => { onClearComments(); setShowClearConfirm(false); }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
}

export default TopBar;

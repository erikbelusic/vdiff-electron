import { useState } from 'react';
import RepositoryPicker from './RepositoryPicker';
import ConfirmDialog from './ConfirmDialog';
import styles from './TopBar.module.css';

function TopBar({ repositories, selectedRepo, onSelectRepo, onAddRepository, onRemoveRepository, disabledRepos, currentBranch, commentCount, onTogglePromptPanel, promptPanelOpen, compactOutput, onToggleCompactOutput, onClearComments, onOpenSettings }) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div className={styles.topBar}>
      <RepositoryPicker
        repositories={repositories}
        selectedRepo={selectedRepo}
        onSelectRepo={onSelectRepo}
        onAddRepository={onAddRepository}
        onRemoveRepository={onRemoveRepository}
        disabledRepos={disabledRepos}
      />
      {currentBranch && (
        <div className={styles.branchBadge}>
          <span className={styles.branchIcon}>&#9741;</span>
          <span>{currentBranch}</span>
        </div>
      )}
      <div className={styles.rightSection}>
        {commentCount > 0 && (
          <>
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
          </>
        )}
        <button
          className={styles.gearBtn}
          onClick={onOpenSettings}
          aria-label="Settings"
        >
          &#9881;
        </button>
      </div>
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

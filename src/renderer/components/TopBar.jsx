import { useState } from 'react';
import RepositoryPicker from './RepositoryPicker';
import ConfirmDialog from './ConfirmDialog';
import styles from './TopBar.module.css';

function TopBar({ projects, selectedRepo, onSelectRepo, onAddRepository, onRemoveProject, onRefreshProjects, disabledRepoPaths, currentBranch, commentCount, hasGeneralComment, onEditGeneralComment, onTogglePromptPanel, promptPanelOpen, compactOutput, onToggleCompactOutput, onClearComments, onOpenSettings, onOpenShortcuts }) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div className={styles.topBar}>
      <RepositoryPicker
        projects={projects}
        selectedRepo={selectedRepo}
        onSelectRepo={onSelectRepo}
        onAddRepository={onAddRepository}
        onRemoveProject={onRemoveProject}
        onRefreshProjects={onRefreshProjects}
        disabledRepoPaths={disabledRepoPaths}
      />
      {currentBranch && (
        <div className={styles.branchBadge}>
          <span className={styles.branchIcon}>&#9741;</span>
          <span>{currentBranch}</span>
        </div>
      )}
      <div className={styles.rightSection}>
        {currentBranch && (
          <button
            className={`${styles.generalBtn} ${hasGeneralComment ? styles.generalBtnActive : ''}`}
            onClick={onEditGeneralComment}
            title="Add a general comment shown above per-line feedback"
          >
            {hasGeneralComment ? 'Edit General Comment' : 'Add General Comment'}
          </button>
        )}
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
          onClick={onOpenShortcuts}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (⌘H)"
        >
          &#8984;
        </button>
        <button
          className={styles.gearBtn}
          onClick={onOpenSettings}
          aria-label="Settings"
          title="Settings (⌘,)"
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

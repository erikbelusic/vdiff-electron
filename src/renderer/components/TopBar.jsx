import RepositoryPicker from './RepositoryPicker';
import styles from './TopBar.module.css';

function TopBar({ repositories, selectedRepo, onSelectRepo, onAddRepository, onRemoveRepository, currentBranch, commentCount, onTogglePromptPanel, promptPanelOpen }) {
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
          <div className={styles.commentBadge}>
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </div>
          <button
            className={`${styles.promptBtn} ${promptPanelOpen ? styles.promptBtnActive : ''}`}
            onClick={onTogglePromptPanel}
          >
            Prompt Output
          </button>
        </div>
      )}
    </div>
  );
}

export default TopBar;

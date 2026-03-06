import styles from './TabBar.module.css';

function getRepoName(repoPath) {
  if (!repoPath) return 'New Tab';
  return repoPath.split('/').pop();
}

function TabBar({ tabs, activeTabId, onSwitchTab, onAddTab, onCloseTab }) {
  return (
    <div className={styles.tabBar}>
      <div className={styles.tabs}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${tab.id === activeTabId ? styles.active : ''}`}
            onClick={() => onSwitchTab(tab.id)}
            title={tab.repoPath ? `${tab.repoPath} (${tab.currentBranch || '...'})` : 'New Tab'}
          >
            {index < 9 && (
              <span className={styles.shortcut}>&#8984;{index + 1}</span>
            )}
            <span className={styles.tabLabel}>
              {getRepoName(tab.repoPath)}
              {tab.currentBranch && (
                <span className={styles.tabBranch}> / {tab.currentBranch}</span>
              )}
            </span>
            {tabs.length > 1 && (
              <span
                className={styles.closeBtn}
                role="button"
                aria-label="Close tab"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
              >
                &times;
              </span>
            )}
          </button>
        ))}
      </div>
      <button
        className={styles.addBtn}
        onClick={onAddTab}
        aria-label="New tab"
        title="New tab (&#8984;T)"
      >
        +
      </button>
    </div>
  );
}

export default TabBar;

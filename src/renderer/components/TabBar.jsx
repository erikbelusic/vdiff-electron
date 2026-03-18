import { useRef, useState } from 'react';
import styles from './TabBar.module.css';

function getRepoName(repoPath) {
  if (!repoPath) return 'New Tab';
  return repoPath.split('/').pop();
}

function TabBar({ tabs, activeTabId, onSwitchTab, onAddTab, onCloseTab, onReorderTabs }) {
  const dragIndexRef = useRef(null);
  const [dropTarget, setDropTarget] = useState(null);

  function handleDragStart(e, index) {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add(styles.dragging);
  }

  function handleDragEnd(e) {
    e.currentTarget.classList.remove(styles.dragging);
    dragIndexRef.current = null;
    setDropTarget(null);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndexRef.current !== null && dragIndexRef.current !== index) {
      setDropTarget(index);
    }
  }

  function handleDrop(e, index) {
    e.preventDefault();
    if (dragIndexRef.current !== null && dragIndexRef.current !== index) {
      onReorderTabs(dragIndexRef.current, index);
    }
    dragIndexRef.current = null;
    setDropTarget(null);
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTarget(null);
    }
  }

  return (
    <div className={styles.tabBar}>
      <div className={styles.tabs}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            className={
              `${styles.tab}` +
              `${tab.id === activeTabId ? ` ${styles.active}` : ''}` +
              `${dropTarget === index ? ` ${styles.dropTarget}` : ''}`
            }
            onClick={() => onSwitchTab(tab.id)}
            title={tab.repoPath ? `${tab.repoPath} (${tab.currentBranch || '...'})` : 'New Tab'}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragLeave={handleDragLeave}
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

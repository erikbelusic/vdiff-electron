import { useState, useRef, useEffect } from 'react';
import styles from './RepositoryPicker.module.css';

function getBasename(p) {
  return p.split('/').pop();
}

function worktreeLabel(wt) {
  const dir = getBasename(wt.path);
  if (wt.detached) return `(detached @ ${wt.head?.slice(0, 7) ?? '?'})`;
  const branch = wt.branch ?? dir;
  return `${branch} (${dir})`;
}

function selectedLabel(projects, selectedRepo) {
  if (!selectedRepo) return 'Select a repository';
  for (const project of projects) {
    const worktrees = project.worktrees ?? [];
    if (worktrees.length <= 1) {
      const path = worktrees[0]?.path ?? project.mainPath;
      if (path === selectedRepo) return project.name;
    } else {
      const wt = worktrees.find((w) => w.path === selectedRepo);
      if (wt) return `${project.name} • ${wt.branch ?? getBasename(wt.path)}`;
    }
  }
  return getBasename(selectedRepo);
}

function RepositoryPicker({
  projects = [],
  selectedRepo,
  onSelectRepo,
  onAddRepository,
  onRemoveProject,
  onRefreshProjects,
  disabledRepoPaths = [],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function open() {
    if (!isOpen) onRefreshProjects?.();
    setIsOpen(!isOpen);
  }

  function selectWorktree(path) {
    onSelectRepo(path);
    setIsOpen(false);
  }

  return (
    <div className={styles.picker} ref={pickerRef}>
      <button
        className={styles.currentRepo}
        onClick={open}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={styles.repoName}>{selectedLabel(projects, selectedRepo)}</span>
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.repoList}>
            {projects.map((project) => {
              const worktrees = project.worktrees ?? [];
              const flat = worktrees.length <= 1;
              const singlePath = worktrees[0]?.path ?? project.mainPath;

              if (flat) {
                const isDisabled = disabledRepoPaths.includes(singlePath);
                const isSelected = singlePath === selectedRepo;
                return (
                  <div
                    key={project.id}
                    className={`${styles.repoItem} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled}
                    onClick={() => { if (!isDisabled) selectWorktree(singlePath); }}
                  >
                    <span className={styles.repoItemName}>{project.name}</span>
                    <span className={styles.repoItemPath}>{singlePath}</span>
                    <button
                      className={styles.removeButton}
                      aria-label={`Remove ${project.name}`}
                      onClick={(e) => { e.stopPropagation(); onRemoveProject(project.id); }}
                    >
                      ×
                    </button>
                  </div>
                );
              }

              return (
                <div key={project.id} className={styles.projectGroup}>
                  <div className={styles.projectHeader}>
                    <span className={styles.projectHeaderName}>{project.name}</span>
                    <button
                      className={styles.removeButton}
                      aria-label={`Remove ${project.name}`}
                      onClick={(e) => { e.stopPropagation(); onRemoveProject(project.id); }}
                    >
                      ×
                    </button>
                  </div>
                  {worktrees.map((wt) => {
                    const isDisabled = disabledRepoPaths.includes(wt.path);
                    const isSelected = wt.path === selectedRepo;
                    return (
                      <div
                        key={wt.path}
                        className={`${styles.repoItem} ${styles.worktreeItem} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={isDisabled}
                        onClick={() => { if (!isDisabled) selectWorktree(wt.path); }}
                      >
                        <span className={styles.repoItemName}>{worktreeLabel(wt)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <button
            className={styles.addRepoButton}
            onClick={() => { onAddRepository(); setIsOpen(false); }}
          >
            + Add Repository
          </button>
        </div>
      )}
    </div>
  );
}

export default RepositoryPicker;

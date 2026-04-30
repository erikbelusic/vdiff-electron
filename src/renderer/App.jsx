import { useState, useEffect, useCallback } from 'react';
import UpdateBanner from './components/UpdateBanner';
import WelcomeScreen from './components/WelcomeScreen';
import TabBar from './components/TabBar';
import TopBar from './components/TopBar';
import FileList from './components/FileList';
import DiffViewer from './components/DiffViewer';
import PromptPanel from './components/PromptPanel';
import SettingsDialog from './components/SettingsDialog';
import ShortcutsDialog from './components/ShortcutsDialog';
import GeneralCommentDialog from './components/GeneralCommentDialog';
import useComments from './hooks/useComments';
import useTabs from './hooks/useTabs';
import { generateExport } from './utils/exportComments';

function fileFingerprint(file) {
  return `${file.status}:${file.additions}:${file.deletions}`;
}

function pruneReviewedFiles(reviewedFiles, files) {
  const fileMap = Object.fromEntries(files.map((f) => [f.path, fileFingerprint(f)]));
  const pruned = {};
  for (const [path, fp] of Object.entries(reviewedFiles)) {
    if (fileMap[path] === fp) {
      pruned[path] = fp;
    }
  }
  return pruned;
}

function App() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [promptPanelOpen, setPromptPanelOpen] = useState(false);
  const [compactOutput, setBriefOutput] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [commentExpiryDays, setCommentExpiryDays] = useState(30);
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showGeneralComment, setShowGeneralComment] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { tabs, activeTab, activeTabId, addTab, closeTab, switchTab, updateTab, reorderTabs, findTabByRepo } = useTabs();

  const selectedRepo = activeTab.repoPath;
  const currentBranch = activeTab.currentBranch;
  const changedFiles = activeTab.changedFiles;
  const selectedFile = activeTab.selectedFile;
  const reviewedFiles = activeTab.reviewedFiles;

  const { comments, generalComment, setGeneralComment, addComment, updateComment, deleteComment, clearAll, loadFromDisk, pruneForFiles } = useComments(selectedRepo, currentBranch);

  useEffect(() => {
    async function loadRepos() {
      const loadedProjects = await window.electronAPI.listProjects();
      setProjects(loadedProjects);
      const lastOpened = await window.electronAPI.getLastOpened();
      const allWorktreePaths = loadedProjects.flatMap((p) => (p.worktrees ?? []).map((wt) => wt.path));
      if (lastOpened && allWorktreePaths.includes(lastOpened)) {
        updateTab(activeTabId, { repoPath: lastOpened });
      }
      const compact = await window.electronAPI.getCompactOutput();
      setBriefOutput(compact);
      const expiry = await window.electronAPI.getCommentExpiryDays();
      setCommentExpiryDays(expiry);
      await window.electronAPI.pruneExpiredBranches(expiry);
      setInitialized(true);
    }
    loadRepos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshRepoState = useCallback(async (repoPath, tabId) => {
    if (!repoPath) {
      updateTab(tabId, { currentBranch: null, changedFiles: [], selectedFile: null, reviewedFiles: {} });
      return { files: [], branch: null };
    }
    const branch = await window.electronAPI.getCurrentBranch(repoPath);
    const files = await window.electronAPI.getChangedFiles(repoPath);
    updateTab(tabId, (prev) => ({
      currentBranch: branch,
      changedFiles: files,
      selectedFile: null,
      reviewedFiles: pruneReviewedFiles(prev.reviewedFiles, files),
    }));
    return { files, branch };
  }, [updateTab]);

  useEffect(() => {
    if (!initialized) return;
    async function init() {
      const { files, branch } = await refreshRepoState(selectedRepo, activeTabId);
      const loaded = await loadFromDisk(selectedRepo, branch);
      if (loaded.length > 0 && files.length > 0) {
        const filePaths = files.map((f) => f.path);
        pruneForFiles(filePaths);
      }
    }
    init();
  }, [selectedRepo, activeTabId, initialized, refreshRepoState, loadFromDisk, pruneForFiles]);

  // Refresh file list and branch when window regains focus
  useEffect(() => {
    async function handleFocus() {
      if (!selectedRepo) return;
      const branch = await window.electronAPI.getCurrentBranch(selectedRepo);
      const files = await window.electronAPI.getChangedFiles(selectedRepo);
      const filePaths = files.map((f) => f.path);
      const preservedFile = selectedFile && filePaths.includes(selectedFile) ? selectedFile : null;
      updateTab(activeTabId, (prev) => ({
        currentBranch: branch,
        changedFiles: files,
        selectedFile: preservedFile,
        reviewedFiles: pruneReviewedFiles(prev.reviewedFiles, files),
      }));
      await loadFromDisk(selectedRepo, branch);
      if (files.length > 0) {
        pruneForFiles(filePaths);
      }
      setRefreshKey((k) => k + 1);
    }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedRepo, selectedFile, activeTabId, updateTab, loadFromDisk, pruneForFiles]);

  const handleRefreshProjects = useCallback(async () => {
    const loadedProjects = await window.electronAPI.listProjects();
    setProjects(loadedProjects);
  }, []);

  const handleAddRepository = async () => {
    setError(null);
    const result = await window.electronAPI.selectFolder();
    if (result.error) {
      setError(result.error);
    } else if (result.path) {
      const loadedProjects = await window.electronAPI.listProjects();
      setProjects(loadedProjects);
      const existing = findTabByRepo(result.path, activeTabId);
      if (!existing) {
        updateTab(activeTabId, { repoPath: result.path });
      }
      await window.electronAPI.setLastOpened(result.path);
    }
  };

  const handleSelectRepo = async (repoPath) => {
    updateTab(activeTabId, { repoPath, selectedFile: null });
    await window.electronAPI.setLastOpened(repoPath);
  };

  const handleRemoveProject = async (gitCommonDir) => {
    const loadedProjects = await window.electronAPI.removeProject(gitCommonDir);
    setProjects(loadedProjects);
    const allWorktreePaths = loadedProjects.flatMap((p) => (p.worktrees ?? []).map((wt) => wt.path));
    if (selectedRepo && !allWorktreePaths.includes(selectedRepo)) {
      updateTab(activeTabId, { repoPath: allWorktreePaths[0] ?? null });
    }
  };

  const handleSaveSettings = async (newExpiryDays) => {
    setCommentExpiryDays(newExpiryDays);
    await window.electronAPI.setCommentExpiryDays(newExpiryDays);
    setShowSettings(false);
  };

  const handleSelectFile = (filePath) => {
    updateTab(activeTabId, { selectedFile: filePath });
  };

  const handleToggleReviewed = (filePath) => {
    const file = changedFiles.find((f) => f.path === filePath);
    if (!file) return;
    const next = { ...reviewedFiles };
    if (next[filePath]) {
      delete next[filePath];
    } else {
      next[filePath] = fileFingerprint(file);
    }
    updateTab(activeTabId, { reviewedFiles: next });
  };

  const handleAddTab = () => {
    addTab();
  };

  const handleCloseTab = (tabId) => {
    closeTab(tabId);
  };

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      // Escape: close topmost panel/dialog
      if (e.key === 'Escape') {
        if (showGeneralComment) { setShowGeneralComment(false); e.preventDefault(); return; }
        if (showShortcuts) { setShowShortcuts(false); e.preventDefault(); return; }
        if (showSettings) { setShowSettings(false); e.preventDefault(); return; }
        if (promptPanelOpen) { setPromptPanelOpen(false); e.preventDefault(); return; }
        return;
      }
      if (!e.metaKey) return;
      if (e.key === 't') {
        e.preventDefault();
        addTab();
      } else if (e.key === 'w') {
        e.preventDefault();
        closeTab(activeTabId);
      } else if (e.key === ',') {
        e.preventDefault();
        setShowSettings(true);
      } else if (e.key === 'h') {
        e.preventDefault();
        setShowShortcuts((v) => !v);
      } else if (e.key === 'e') {
        e.preventDefault();
        if (selectedRepo) setPromptPanelOpen((v) => !v);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (changedFiles.length > 0) {
          const idx = changedFiles.findIndex((f) => f.path === selectedFile);
          const prev = idx <= 0 ? changedFiles.length - 1 : idx - 1;
          updateTab(activeTabId, { selectedFile: changedFiles[prev].path });
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (changedFiles.length > 0) {
          const idx = changedFiles.findIndex((f) => f.path === selectedFile);
          const next = idx < 0 || idx >= changedFiles.length - 1 ? 0 : idx + 1;
          updateTab(activeTabId, { selectedFile: changedFiles[next].path });
        }
      } else if (e.key === 'c' && e.shiftKey) {
        e.preventDefault();
        const text = generateExport(comments, { compact: compactOutput, generalComment });
        if (text) {
          navigator.clipboard.writeText(text);
        }
      } else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        if (index < tabs.length) {
          switchTab(tabs[index].id);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, addTab, closeTab, switchTab, showShortcuts, showSettings, showGeneralComment, promptPanelOpen, selectedRepo, selectedFile, changedFiles, comments, generalComment, compactOutput, updateTab]);

  const disabledRepoPaths = tabs
    .filter((t) => t.id !== activeTabId && t.repoPath)
    .map((t) => t.repoPath);

  const showWelcome = !selectedRepo && projects.length === 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <UpdateBanner />
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSwitchTab={switchTab}
        onAddTab={handleAddTab}
        onCloseTab={handleCloseTab}
        onReorderTabs={reorderTabs}
      />
      {showWelcome ? (
        <WelcomeScreen onAddRepository={handleAddRepository} error={error} />
      ) : (
        <>
          <TopBar
            projects={projects}
            selectedRepo={selectedRepo}
            onSelectRepo={handleSelectRepo}
            onAddRepository={handleAddRepository}
            onRemoveProject={handleRemoveProject}
            onRefreshProjects={handleRefreshProjects}
            disabledRepoPaths={disabledRepoPaths}
            currentBranch={currentBranch}
            commentCount={comments.length}
            hasGeneralComment={!!(generalComment && generalComment.trim())}
            onEditGeneralComment={() => setShowGeneralComment(true)}
            onTogglePromptPanel={() => setPromptPanelOpen((v) => !v)}
            promptPanelOpen={promptPanelOpen}
            compactOutput={compactOutput}
            onToggleCompactOutput={() => {
              setBriefOutput((v) => {
                const next = !v;
                window.electronAPI.setCompactOutput(next);
                return next;
              });
            }}
            onClearComments={clearAll}
            onOpenSettings={() => setShowSettings(true)}
            onOpenShortcuts={() => setShowShortcuts(true)}
          />
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {selectedRepo ? (
              <>
                <FileList
                  files={changedFiles}
                  selectedFile={selectedFile}
                  onSelectFile={handleSelectFile}
                  reviewedFiles={reviewedFiles}
                  onToggleReviewed={handleToggleReviewed}
                />
                <DiffViewer
                  repoPath={selectedRepo}
                  filePath={selectedFile}
                  refreshKey={refreshKey}
                  comments={comments}
                  onAddComment={addComment}
                  onUpdateComment={updateComment}
                  onDeleteComment={deleteComment}
                />
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                Select a repository to view diffs
              </div>
            )}
          </div>
          {promptPanelOpen && (
            <PromptPanel
              comments={comments}
              compact={compactOutput}
              generalComment={generalComment}
              onClose={() => setPromptPanelOpen(false)}
            />
          )}
          {showGeneralComment && (
            <GeneralCommentDialog
              value={generalComment}
              onSave={(text) => {
                setGeneralComment(text);
                setShowGeneralComment(false);
              }}
              onCancel={() => setShowGeneralComment(false)}
            />
          )}
          {showSettings && (
            <SettingsDialog
              commentExpiryDays={commentExpiryDays}
              onSave={handleSaveSettings}
              onCancel={() => setShowSettings(false)}
            />
          )}
          {showShortcuts && (
            <ShortcutsDialog onClose={() => setShowShortcuts(false)} />
          )}
        </>
      )}
    </div>
  );
}

export default App;

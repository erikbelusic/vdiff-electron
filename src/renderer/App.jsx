import { useState, useEffect, useCallback } from 'react';
import UpdateBanner from './components/UpdateBanner';
import WelcomeScreen from './components/WelcomeScreen';
import TabBar from './components/TabBar';
import TopBar from './components/TopBar';
import FileList from './components/FileList';
import DiffViewer from './components/DiffViewer';
import PromptPanel from './components/PromptPanel';
import SettingsDialog from './components/SettingsDialog';
import useComments from './hooks/useComments';
import useTabs from './hooks/useTabs';

function App() {
  const [repositories, setRepositories] = useState([]);
  const [error, setError] = useState(null);
  const [promptPanelOpen, setPromptPanelOpen] = useState(false);
  const [compactOutput, setBriefOutput] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [commentExpiryDays, setCommentExpiryDays] = useState(30);
  const [showSettings, setShowSettings] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { tabs, activeTab, activeTabId, addTab, closeTab, switchTab, updateTab, findTabByRepo } = useTabs();

  const selectedRepo = activeTab.repoPath;
  const currentBranch = activeTab.currentBranch;
  const changedFiles = activeTab.changedFiles;
  const selectedFile = activeTab.selectedFile;

  const { comments, addComment, updateComment, deleteComment, clearAll, loadFromDisk, pruneForFiles } = useComments(selectedRepo, currentBranch);

  useEffect(() => {
    async function loadRepos() {
      const repos = await window.electronAPI.getRepositories();
      setRepositories(repos);
      const lastOpened = await window.electronAPI.getLastOpened();
      if (lastOpened && repos.includes(lastOpened)) {
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
      updateTab(tabId, { currentBranch: null, changedFiles: [], selectedFile: null });
      return { files: [], branch: null };
    }
    const branch = await window.electronAPI.getCurrentBranch(repoPath);
    const files = await window.electronAPI.getChangedFiles(repoPath);
    updateTab(tabId, {
      currentBranch: branch,
      changedFiles: files,
      selectedFile: null,
    });
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
      const { files, branch } = await refreshRepoState(selectedRepo, activeTabId);
      await loadFromDisk(selectedRepo, branch);
      if (files.length > 0) {
        pruneForFiles(files.map((f) => f.path));
      }
      setRefreshKey((k) => k + 1);
    }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedRepo, activeTabId, refreshRepoState, loadFromDisk, pruneForFiles]);

  const handleAddRepository = async () => {
    setError(null);
    const result = await window.electronAPI.selectFolder();
    if (result.error) {
      setError(result.error);
    } else if (result.path) {
      const repos = await window.electronAPI.getRepositories();
      setRepositories(repos);
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

  const handleRemoveRepository = async (repoPath) => {
    const repos = await window.electronAPI.removeRepository(repoPath);
    setRepositories(repos);
    if (selectedRepo === repoPath) {
      updateTab(activeTabId, { repoPath: repos.length > 0 ? repos[0] : null });
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

  const handleAddTab = () => {
    addTab();
  };

  const handleCloseTab = (tabId) => {
    closeTab(tabId);
  };

  // Keyboard shortcuts: Cmd+1-9 switch tabs, Cmd+T new tab, Cmd+W close tab
  useEffect(() => {
    function handleKeyDown(e) {
      if (!e.metaKey) return;
      if (e.key === 't') {
        e.preventDefault();
        addTab();
      } else if (e.key === 'w') {
        e.preventDefault();
        closeTab(activeTabId);
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
  }, [tabs, activeTabId, addTab, closeTab, switchTab]);

  const disabledRepos = tabs
    .filter((t) => t.id !== activeTabId && t.repoPath)
    .map((t) => t.repoPath);

  const showWelcome = !selectedRepo && repositories.length === 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <UpdateBanner />
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSwitchTab={switchTab}
        onAddTab={handleAddTab}
        onCloseTab={handleCloseTab}
      />
      {showWelcome ? (
        <WelcomeScreen onAddRepository={handleAddRepository} error={error} />
      ) : (
        <>
          <TopBar
            repositories={repositories}
            selectedRepo={selectedRepo}
            onSelectRepo={handleSelectRepo}
            onAddRepository={handleAddRepository}
            onRemoveRepository={handleRemoveRepository}
            disabledRepos={disabledRepos}
            currentBranch={currentBranch}
            commentCount={comments.length}
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
          />
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {selectedRepo ? (
              <>
                <FileList
                  files={changedFiles}
                  selectedFile={selectedFile}
                  onSelectFile={handleSelectFile}
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
              onClose={() => setPromptPanelOpen(false)}
            />
          )}
          {showSettings && (
            <SettingsDialog
              commentExpiryDays={commentExpiryDays}
              onSave={handleSaveSettings}
              onCancel={() => setShowSettings(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;

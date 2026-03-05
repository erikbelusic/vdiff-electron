import { useState, useEffect, useCallback } from 'react';
import UpdateBanner from './components/UpdateBanner';
import WelcomeScreen from './components/WelcomeScreen';
import TopBar from './components/TopBar';
import FileList from './components/FileList';
import DiffViewer from './components/DiffViewer';
import PromptPanel from './components/PromptPanel';
import SettingsDialog from './components/SettingsDialog';
import useComments from './hooks/useComments';

function App() {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [changedFiles, setChangedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const { comments, addComment, updateComment, deleteComment, clearAll, loadFromDisk, pruneForFiles } = useComments(selectedRepo, currentBranch);
  const [promptPanelOpen, setPromptPanelOpen] = useState(false);
  const [compactOutput, setBriefOutput] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [commentExpiryDays, setCommentExpiryDays] = useState(30);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    async function loadRepos() {
      const repos = await window.electronAPI.getRepositories();
      setRepositories(repos);
      const lastOpened = await window.electronAPI.getLastOpened();
      if (lastOpened && repos.includes(lastOpened)) {
        setSelectedRepo(lastOpened);
      }
      const compact = await window.electronAPI.getCompactOutput();
      setBriefOutput(compact);
      const expiry = await window.electronAPI.getCommentExpiryDays();
      setCommentExpiryDays(expiry);
      await window.electronAPI.pruneExpiredBranches(expiry);
    }
    loadRepos();
  }, []);

  const refreshRepoState = useCallback(async (repoPath) => {
    if (!repoPath) {
      setCurrentBranch(null);
      setChangedFiles([]);
      setSelectedFile(null);
      return { files: [], branch: null };
    }
    const branch = await window.electronAPI.getCurrentBranch(repoPath);
    setCurrentBranch(branch);
    const files = await window.electronAPI.getChangedFiles(repoPath);
    setChangedFiles(files);
    setSelectedFile((prev) => {
      if (prev && !files.some((f) => f.path === prev)) return null;
      return prev;
    });
    return { files, branch };
  }, []);

  useEffect(() => {
    async function init() {
      const { files, branch } = await refreshRepoState(selectedRepo);
      const loaded = await loadFromDisk(selectedRepo, branch);
      if (loaded.length > 0 && files.length > 0) {
        const filePaths = files.map((f) => f.path);
        pruneForFiles(filePaths);
      }
    }
    init();
  }, [selectedRepo, refreshRepoState, loadFromDisk, pruneForFiles]);

  // Refresh file list and branch when window regains focus
  useEffect(() => {
    async function handleFocus() {
      const { files, branch } = await refreshRepoState(selectedRepo);
      await loadFromDisk(selectedRepo, branch);
      if (files.length > 0) {
        pruneForFiles(files.map((f) => f.path));
      }
      setRefreshKey((k) => k + 1);
    }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedRepo, refreshRepoState, loadFromDisk, pruneForFiles]);

  const handleAddRepository = async () => {
    setError(null);
    const result = await window.electronAPI.selectFolder();
    if (result.error) {
      setError(result.error);
    } else if (result.path) {
      const repos = await window.electronAPI.getRepositories();
      setRepositories(repos);
      setSelectedRepo(result.path);
      await window.electronAPI.setLastOpened(result.path);
    }
  };

  const handleSelectRepo = async (repoPath) => {
    setSelectedRepo(repoPath);
    setSelectedFile(null);
    await window.electronAPI.setLastOpened(repoPath);
  };

  const handleRemoveRepository = async (repoPath) => {
    const repos = await window.electronAPI.removeRepository(repoPath);
    setRepositories(repos);
    if (selectedRepo === repoPath) {
      setSelectedRepo(repos.length > 0 ? repos[0] : null);
    }
  };

  const handleSaveSettings = async (newExpiryDays) => {
    setCommentExpiryDays(newExpiryDays);
    await window.electronAPI.setCommentExpiryDays(newExpiryDays);
    setShowSettings(false);
  };

  if (!selectedRepo) {
    return (
      <>
        <UpdateBanner />
        <WelcomeScreen onAddRepository={handleAddRepository} error={error} />
      </>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <UpdateBanner />
      <TopBar
        repositories={repositories}
        selectedRepo={selectedRepo}
        onSelectRepo={handleSelectRepo}
        onAddRepository={handleAddRepository}
        onRemoveRepository={handleRemoveRepository}
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
        <FileList
          files={changedFiles}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
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
    </div>
  );
}

export default App;

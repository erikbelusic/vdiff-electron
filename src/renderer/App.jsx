import { useState, useEffect, useCallback } from 'react';
import UpdateBanner from './components/UpdateBanner';
import WelcomeScreen from './components/WelcomeScreen';
import TopBar from './components/TopBar';
import FileList from './components/FileList';
import DiffViewer from './components/DiffViewer';
import PromptPanel from './components/PromptPanel';
import useComments from './hooks/useComments';

function App() {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [changedFiles, setChangedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const { comments, addComment, updateComment, deleteComment, clearAll, loadFromDisk, pruneForFiles } = useComments(selectedRepo);
  const [promptPanelOpen, setPromptPanelOpen] = useState(false);
  const [compactOutput, setBriefOutput] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
    }
    loadRepos();
  }, []);

  const refreshRepoState = useCallback(async (repoPath) => {
    if (!repoPath) {
      setCurrentBranch(null);
      setChangedFiles([]);
      return [];
    }
    const branch = await window.electronAPI.getCurrentBranch(repoPath);
    setCurrentBranch(branch);
    const files = await window.electronAPI.getChangedFiles(repoPath);
    setChangedFiles(files);
    return files;
  }, []);

  useEffect(() => {
    async function init() {
      const files = await refreshRepoState(selectedRepo);
      const loaded = await loadFromDisk(selectedRepo);
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
      const files = await refreshRepoState(selectedRepo);
      if (files.length > 0) {
        pruneForFiles(files.map((f) => f.path));
      }
      setRefreshKey((k) => k + 1);
    }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedRepo, refreshRepoState, pruneForFiles]);

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
    </div>
  );
}

export default App;

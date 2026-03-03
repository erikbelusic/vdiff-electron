import { useState, useEffect, useCallback } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import TopBar from './components/TopBar';
import FileList from './components/FileList';
import DiffViewer from './components/DiffViewer';

function App() {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [changedFiles, setChangedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadRepos() {
      const repos = await window.electronAPI.getRepositories();
      setRepositories(repos);
      const lastOpened = await window.electronAPI.getLastOpened();
      if (lastOpened && repos.includes(lastOpened)) {
        setSelectedRepo(lastOpened);
      }
    }
    loadRepos();
  }, []);

  const refreshRepoState = useCallback(async (repoPath) => {
    if (!repoPath) {
      setCurrentBranch(null);
      setChangedFiles([]);
      return;
    }
    const branch = await window.electronAPI.getCurrentBranch(repoPath);
    setCurrentBranch(branch);
    const files = await window.electronAPI.getChangedFiles(repoPath);
    setChangedFiles(files);
  }, []);

  useEffect(() => {
    refreshRepoState(selectedRepo);
  }, [selectedRepo, refreshRepoState]);

  // Refresh file list and branch when window regains focus
  useEffect(() => {
    function handleFocus() {
      refreshRepoState(selectedRepo);
    }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedRepo, refreshRepoState]);

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
      <WelcomeScreen onAddRepository={handleAddRepository} error={error} />
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        repositories={repositories}
        selectedRepo={selectedRepo}
        onSelectRepo={handleSelectRepo}
        onAddRepository={handleAddRepository}
        onRemoveRepository={handleRemoveRepository}
        currentBranch={currentBranch}
      />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <FileList
          files={changedFiles}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
        />
        <DiffViewer repoPath={selectedRepo} filePath={selectedFile} />
      </div>
    </div>
  );
}

export default App;

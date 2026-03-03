import { useState, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import TopBar from './components/TopBar';
import FileList from './components/FileList';

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

  useEffect(() => {
    async function fetchBranch() {
      if (selectedRepo) {
        const branch = await window.electronAPI.getCurrentBranch(selectedRepo);
        setCurrentBranch(branch);
      } else {
        setCurrentBranch(null);
      }
    }
    fetchBranch();
  }, [selectedRepo]);

  useEffect(() => {
    async function fetchFiles() {
      if (selectedRepo) {
        const files = await window.electronAPI.getChangedFiles(selectedRepo);
        setChangedFiles(files);
        if (files.length > 0 && !selectedFile) {
          setSelectedFile(files[0].path);
        }
      } else {
        setChangedFiles([]);
        setSelectedFile(null);
      }
    }
    fetchFiles();
  }, [selectedRepo]);

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
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
          {selectedFile ? `Diff for ${selectedFile}` : 'Select a file to view its diff'}
        </div>
      </div>
    </div>
  );
}

export default App;

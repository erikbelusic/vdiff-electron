import { useState, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import TopBar from './components/TopBar';

function App() {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
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
      />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
        Diff viewer coming soon
      </div>
    </div>
  );
}

export default App;

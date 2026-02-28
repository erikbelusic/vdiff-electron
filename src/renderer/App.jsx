import { useState, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';

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
    }
  };

  if (!selectedRepo) {
    return (
      <WelcomeScreen onAddRepository={handleAddRepository} error={error} />
    );
  }

  return <div>Repo selected: {selectedRepo}</div>;
}

export default App;

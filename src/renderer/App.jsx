import { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';

function App() {
  const [error, setError] = useState(null);

  const handleAddRepository = async () => {
    setError(null);
    const result = await window.electronAPI.selectFolder();
    if (result.error) {
      setError(result.error);
    } else if (result.path) {
      console.log('Selected repo:', result.path);
    }
  };

  return <WelcomeScreen onAddRepository={handleAddRepository} error={error} />;
}

export default App;

import WelcomeScreen from './components/WelcomeScreen';

function App() {
  const handleAddRepository = async () => {
    const folderPath = await window.electronAPI.selectFolder();
    if (folderPath) {
      console.log('Selected folder:', folderPath);
    }
  };

  return <WelcomeScreen onAddRepository={handleAddRepository} />;
}

export default App;

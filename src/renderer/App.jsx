import WelcomeScreen from './components/WelcomeScreen';

function App() {
  const handleAddRepository = () => {
    // Will be wired up to open folder picker dialog via IPC
  };

  return <WelcomeScreen onAddRepository={handleAddRepository} />;
}

export default App;

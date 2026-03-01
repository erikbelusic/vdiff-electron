import RepositoryPicker from './RepositoryPicker';
import styles from './TopBar.module.css';

function TopBar({ repositories, selectedRepo, onSelectRepo, onAddRepository, onRemoveRepository }) {
  return (
    <div className={styles.topBar}>
      <RepositoryPicker
        repositories={repositories}
        selectedRepo={selectedRepo}
        onSelectRepo={onSelectRepo}
        onAddRepository={onAddRepository}
        onRemoveRepository={onRemoveRepository}
      />
    </div>
  );
}

export default TopBar;

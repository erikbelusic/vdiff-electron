import styles from './WelcomeScreen.module.css';

function WelcomeScreen({ onAddRepository }) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>vdiff</h1>
      <p className={styles.subtitle}>
        Add a Git repository to get started viewing diffs and commenting on code
        for AI review.
      </p>
      <button className={styles.addButton} onClick={onAddRepository}>
        Add Repository
      </button>
    </div>
  );
}

export default WelcomeScreen;

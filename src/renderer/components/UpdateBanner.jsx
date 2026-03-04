import { useState, useEffect } from 'react';
import styles from './UpdateBanner.module.css';

function UpdateBanner() {
  const [update, setUpdate] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    window.electronAPI.checkForUpdate().then((result) => {
      if (result) setUpdate(result);
    });
  }, []);

  if (!update || dismissed) return null;

  return (
    <div className={styles.banner} role="status">
      <span>vdiff v{update.version} is available</span>
      <a
        className={styles.link}
        href={update.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        Download
      </a>
      <button
        className={styles.dismiss}
        onClick={() => setDismissed(true)}
        aria-label="Dismiss update notification"
      >
        ×
      </button>
    </div>
  );
}

export default UpdateBanner;

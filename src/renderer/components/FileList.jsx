import styles from './FileList.module.css';

function getFileName(filePath) {
  return filePath.split('/').pop();
}

function getFileDir(filePath) {
  const parts = filePath.split('/');
  if (parts.length <= 1) return '';
  return parts.slice(0, -1).join('/') + '/';
}

const STATUS_LABELS = {
  A: 'Added',
  M: 'Modified',
  D: 'Deleted',
  R: 'Renamed',
};

function FileList({ files, selectedFile, onSelectFile }) {
  if (files.length === 0) {
    return (
      <div className={styles.sidebar}>
        <div className={styles.header}>Changed Files</div>
        <div className={styles.empty}>No changed files</div>
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        {files.length} changed {files.length === 1 ? 'file' : 'files'}
      </div>
      <div className={styles.list}>
        {files.map((file) => (
          <button
            key={file.path}
            className={`${styles.fileItem} ${file.path === selectedFile ? styles.selected : ''}`}
            onClick={() => onSelectFile(file.path)}
            title={file.path}
          >
            <span
              className={`${styles.statusBadge} ${styles['status' + file.status]}`}
              aria-label={STATUS_LABELS[file.status]}
            >
              {file.status}
            </span>
            <span className={styles.fileInfo}>
              <span className={styles.fileName}>{getFileName(file.path)}</span>
              {getFileDir(file.path) && (
                <span className={styles.filePath}>{getFileDir(file.path)}</span>
              )}
            </span>
            {(file.additions > 0 || file.deletions > 0) && (
              <span className={styles.stats}>
                {file.additions > 0 && (
                  <span className={styles.statsAdd}>+{file.additions}</span>
                )}
                {file.deletions > 0 && (
                  <span className={styles.statsDel}>-{file.deletions}</span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default FileList;

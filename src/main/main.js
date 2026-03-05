import { app, BrowserWindow, dialog, ipcMain, net } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { getRepositories, addRepository, removeRepository, getLastOpened, setLastOpened, getCompactOutput, setCompactOutput, getCommentExpiryDays, setCommentExpiryDays } from './store.js';
import { getComments, saveComments, pruneExpiredBranches } from './commentsStore.js';
import { isGitRepo, getCurrentBranch, getChangedFiles, getFileDiff } from './git.js';

const GITHUB_OWNER = 'erikbelusic';
const GITHUB_REPO = 'vdiff-electron';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Dialog
ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select a Git Repository',
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { path: null };
  }
  const folderPath = result.filePaths[0];
  const isGit = await isGitRepo(folderPath);
  if (!isGit) {
    return { path: null, error: 'The selected folder is not a Git repository.' };
  }
  addRepository(folderPath);
  return { path: folderPath };
});

// Repository management
ipcMain.handle('repo:getAll', () => getRepositories());
ipcMain.handle('repo:remove', (_event, repoPath) => removeRepository(repoPath));
ipcMain.handle('repo:getLastOpened', () => getLastOpened());
ipcMain.handle('repo:setLastOpened', (_event, repoPath) => setLastOpened(repoPath));
ipcMain.handle('repo:getCompactOutput', () => getCompactOutput());
ipcMain.handle('repo:setCompactOutput', (_event, value) => setCompactOutput(value));

// Comments persistence
ipcMain.handle('comments:load', (_event, repoPath, branch) => getComments(repoPath, branch));
ipcMain.handle('comments:save', (_event, repoPath, branch, comments) => saveComments(repoPath, branch, comments));
ipcMain.handle('comments:pruneExpired', (_event, expiryDays) => pruneExpiredBranches(expiryDays));

// Settings
ipcMain.handle('settings:getCommentExpiryDays', () => getCommentExpiryDays());
ipcMain.handle('settings:setCommentExpiryDays', (_event, value) => setCommentExpiryDays(value));

// Git operations
ipcMain.handle('git:getCurrentBranch', (_event, repoPath) => getCurrentBranch(repoPath));
ipcMain.handle('git:getChangedFiles', (_event, repoPath) => getChangedFiles(repoPath));
ipcMain.handle('git:getFileDiff', (_event, repoPath, filePath) => getFileDiff(repoPath, filePath));

// Update check
ipcMain.handle('app:checkForUpdate', async () => {
  const currentVersion = app.getVersion();
  try {
    const response = await net.fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      { headers: { 'User-Agent': 'vdiff-electron' } }
    );
    if (!response.ok) return null;
    const release = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, '');
    if (compareVersions(latestVersion, currentVersion) > 0) {
      return { version: latestVersion, url: release.html_url };
    }
    return null;
  } catch {
    return null;
  }
});

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

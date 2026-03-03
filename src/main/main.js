import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { getRepositories, addRepository, removeRepository, getLastOpened, setLastOpened } from './store.js';
import { isGitRepo, getCurrentBranch, getChangedFiles, getFileDiff } from './git.js';

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

// Git operations
ipcMain.handle('git:getCurrentBranch', (_event, repoPath) => getCurrentBranch(repoPath));
ipcMain.handle('git:getChangedFiles', (_event, repoPath) => getChangedFiles(repoPath));
ipcMain.handle('git:getFileDiff', (_event, repoPath, filePath) => getFileDiff(repoPath, filePath));

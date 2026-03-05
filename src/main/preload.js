const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  getRepositories: () => ipcRenderer.invoke('repo:getAll'),
  removeRepository: (repoPath) => ipcRenderer.invoke('repo:remove', repoPath),
  getLastOpened: () => ipcRenderer.invoke('repo:getLastOpened'),
  setLastOpened: (repoPath) => ipcRenderer.invoke('repo:setLastOpened', repoPath),
  getCompactOutput: () => ipcRenderer.invoke('repo:getCompactOutput'),
  setCompactOutput: (value) => ipcRenderer.invoke('repo:setCompactOutput', value),
  getCurrentBranch: (repoPath) => ipcRenderer.invoke('git:getCurrentBranch', repoPath),
  getChangedFiles: (repoPath) => ipcRenderer.invoke('git:getChangedFiles', repoPath),
  getFileDiff: (repoPath, filePath) => ipcRenderer.invoke('git:getFileDiff', repoPath, filePath),
  loadComments: (repoPath, branch) => ipcRenderer.invoke('comments:load', repoPath, branch),
  saveComments: (repoPath, branch, comments) => ipcRenderer.invoke('comments:save', repoPath, branch, comments),
  pruneExpiredBranches: (expiryDays) => ipcRenderer.invoke('comments:pruneExpired', expiryDays),
  getCommentExpiryDays: () => ipcRenderer.invoke('settings:getCommentExpiryDays'),
  setCommentExpiryDays: (value) => ipcRenderer.invoke('settings:setCommentExpiryDays', value),
  checkForUpdate: () => ipcRenderer.invoke('app:checkForUpdate'),
});

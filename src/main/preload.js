const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  getRepositories: () => ipcRenderer.invoke('repo:getAll'),
  removeRepository: (repoPath) => ipcRenderer.invoke('repo:remove', repoPath),
  getLastOpened: () => ipcRenderer.invoke('repo:getLastOpened'),
  setLastOpened: (repoPath) => ipcRenderer.invoke('repo:setLastOpened', repoPath),
  getCurrentBranch: (repoPath) => ipcRenderer.invoke('git:getCurrentBranch', repoPath),
});

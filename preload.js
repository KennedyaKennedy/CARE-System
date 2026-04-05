const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('careAPI', {
  fetchLLM: (body) => ipcRenderer.invoke('llm-request', body),
  closeApp: () => ipcRenderer.send('close-app')
});

ipcRenderer.on('close-request', () => {
  ipcRenderer.send('close-app');
});

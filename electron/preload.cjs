const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  printReceipt: (options) => ipcRenderer.invoke('print-thermal-receipt', options),
  printLabel: (options) => ipcRenderer.invoke('print-label', options),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  saveBackupFile: (params) => ipcRenderer.invoke('save-backup-file', params),
  loadBackupFile: () => ipcRenderer.invoke('load-backup-file'),
});

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Supermarket POS & Management System',
    backgroundColor: '#020617', // slate-950
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  const devServerUrl = 'http://localhost:5173';
  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

  if (isDev) {
    mainWindow.loadURL(devServerUrl).catch(() => {
      if (fs.existsSync(distPath)) {
        mainWindow.loadFile(distPath);
      }
    });
  } else if (fs.existsSync(distPath)) {
    // 100% offline launch
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL(devServerUrl);
  }

  mainWindow.webContents.on('did-fail-load', () => {
    if (fs.existsSync(distPath)) {
      mainWindow.loadFile(distPath);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for Thermal Receipt Printing
ipcMain.handle('print-thermal-receipt', async (event, options = {}) => {
  if (!mainWindow) return { success: false, error: 'No active window' };
  try {
    mainWindow.webContents.print({
      silent: options.silent || false,
      printBackground: true,
      deviceName: options.printerName || '',
      pageSize: {
        width: 80000, // 80mm
        height: 200000
      }
    }, (success, failureReason) => {
      if (!success) console.warn('Print failed:', failureReason);
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: Get list of installed Windows printer drivers
ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    return printers || [];
  } catch (err) {
    console.warn('Failed to retrieve printers:', err);
    return [];
  }
});

// IPC Handler: Print Label directly to target driver with custom dimensions
ipcMain.handle('print-label', async (event, options = {}) => {
  try {
    const widthMm = Number(options.widthMm) || 50;
    const heightMm = Number(options.heightMm) || 30;
    const widthMicrons = Math.round(widthMm * 1000);
    const heightMicrons = Math.round(heightMm * 1000);

    const printWin = new BrowserWindow({
      show: false,
      width: 400,
      height: 300,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const htmlContent = options.html || '<html><body>Label</body></html>';
    await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    return new Promise((resolve) => {
      printWin.webContents.print({
        silent: options.silent === true,
        printBackground: true,
        deviceName: options.deviceName || '',
        copies: Number(options.copies) || 1,
        pageSize: {
          width: widthMicrons,
          height: heightMicrons
        },
        margins: {
          marginType: 'none'
        }
      }, (success, failureReason) => {
        try { printWin.close(); } catch (e) {}
        if (!success) {
          console.warn('Label print failed:', failureReason);
          resolve({ success: false, error: failureReason });
        } else {
          resolve({ success: true });
        }
      });
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler to save database backup to disk
ipcMain.handle('save-backup-file', async (event, { data, filename }) => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Database Backup',
      defaultPath: filename || `supermarket_pos_backup_${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON Backup', extensions: ['json'] }]
    });

    if (canceled || !filePath) return { canceled: true };
    fs.writeFileSync(filePath, data, 'utf-8');
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler to load database backup from disk
ipcMain.handle('load-backup-file', async () => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Backup File to Restore',
      properties: ['openFile'],
      filters: [{ name: 'JSON Backup', extensions: ['json'] }]
    });

    if (canceled || !filePaths || filePaths.length === 0) return { canceled: true };
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    return { success: true, data: content, filePath: filePaths[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

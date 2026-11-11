const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 420,
    minHeight: 540,
    title: 'CyberTwin Cozy Studio · 赛博伴生桌面客户端',
    autoHideMenuBar: true,
    backgroundColor: '#FBF6EE',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  if (!app.isPackaged) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

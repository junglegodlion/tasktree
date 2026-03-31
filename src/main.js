const { app, BrowserWindow, ipcMain, Notification, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(app.getPath('userData'), 'tasktree-data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return { users: [], tasks: [], inviteCodes: [], currentUser: null };
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch { return { users: [], tasks: [], inviteCodes: [], currentUser: null }; }
}

function saveData(data) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

let mainWindow;

function createWindow() {
  const builtIco = path.join(__dirname, '..', 'build', 'icon.ico');
  const fallbackPng = path.join(__dirname, 'icon.png');
  const iconPath = fs.existsSync(builtIco) ? builtIco : (fs.existsSync(fallbackPng) ? fallbackPng : null);
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    frame: false,
    backgroundColor: '#f6f7fb',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    ...(iconPath ? { icon: iconPath } : {})
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ── IPC Handlers ──────────────────────────────────────────────

ipcMain.handle('data:load', () => loadData());
ipcMain.handle('data:save', (_, data) => { saveData(data); return true; });

ipcMain.handle('notify', (_, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

ipcMain.handle('window:setTitle', (_, title) => {
  if (mainWindow) mainWindow.setTitle(title);
});

ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('window:close', () => mainWindow?.close());

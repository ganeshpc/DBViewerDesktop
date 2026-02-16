/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/ban-ts-comment */
// @ts-nocheck
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');
const { createSampleDatabase, getConnection } = require('./db');

let mainWindow = null;
let currentDB = null;
let currentDBPath = '';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Preload CJS for reliable Electron sandbox loading
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    title: 'DBViewer',
  });

  // Use full available window space
  mainWindow.maximize();

  // Load the index.html of the app.
  if (process.env.NODE_ENV === 'development') {
    // In dev, load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};


const getConnection = (connectionString) => {
  // Support SQLite connection strings like "sqlite:///absolute/path/to/db.db" or just path
  let dbPath = connectionString;
  if (connectionString.startsWith('sqlite:')) {
    // Extract path, support sqlite:// or sqlite:/// 
    dbPath = connectionString.replace(/^sqlite:\/\//, '').replace(/^sqlite:/, '');
    // Make absolute if relative
    if (!path.isAbsolute(dbPath)) {
      dbPath = path.resolve(dbPath);
    }
  }
  return dbPath;
};

// IPC handlers
ipcMain.handle('db:connect', async (_event, connectionString) => {
  try {
    const dbPath = getConnection(connectionString);
    
    // Close existing DB if open
    if (currentDB) {
      currentDB.close();
    }

    // For sample, if special, create
    if (connectionString === 'sample') {
      const userDataPath = app.getPath('userData');
      const samplePath = path.join(userDataPath, 'sample.db');
      currentDBPath = createSampleDatabase(samplePath);
    } else {
      currentDBPath = dbPath;
      // Ensure dir exists
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    currentDB = new Database(currentDBPath);
    // Enable foreign keys etc
    currentDB.pragma('foreign_keys = ON');
    
    return { success: true, path: currentDBPath, message: 'Connected successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:listTables', async () => {
  if (!currentDB) {
    throw new Error('No database connected');
  }
  const tables = currentDB.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all();
  return tables.map((t) => ({ name: t.name }));
});

ipcMain.handle('db:getTableData', async (_event, tableName, limit = 10, offset = 0) => {
  if (!currentDB) {
    throw new Error('No database connected');
  }
  // Get columns
  const columnsInfo = currentDB.prepare(`PRAGMA table_info(${tableName})`).all();
  const columns = columnsInfo.map((col) => col.name);
  
  // Get data with limit
  const stmt = currentDB.prepare(`SELECT * FROM ${tableName} LIMIT ? OFFSET ?`);
  const rows = stmt.all(limit, offset);
  
  return {
    columns,
    rows,
    rowCount: rows.length,
    totalRows: (currentDB.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get()).count
  };
});

ipcMain.handle('db:createSample', async () => {
  const userDataPath = app.getPath('userData');
  const samplePath = path.join(userDataPath, 'sample.db');
  const fullPath = createSampleDatabase(samplePath);
  return { path: fullPath, connectionString: `sqlite://${fullPath}` };
});

ipcMain.handle('app:getDataPath', async () => {
  return app.getPath('userData');
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Auto-create sample DB on launch (idempotent, with data; no user action needed)
  const userDataPath = app.getPath('userData');
  const samplePath = path.join(userDataPath, 'sample.db');
  createSampleDatabase(samplePath);

  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up DB on quit
app.on('before-quit', () => {
  if (currentDB) {
    currentDB.close();
  }
});

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/ban-ts-comment */
// @ts-nocheck
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire ipcRenderer object
contextBridge.exposeInMainWorld('electronAPI', {
  // DB operations
  connectToDB: (connectionString) => 
    ipcRenderer.invoke('db:connect', connectionString),
  
  listTables: () => 
    ipcRenderer.invoke('db:listTables'),
  
  getTableData: (tableName, limit = 10, offset = 0) => 
    ipcRenderer.invoke('db:getTableData', tableName, limit, offset),
  
  // For sample DB creation (kept for future)
  createSampleDB: () => 
    ipcRenderer.invoke('db:createSample'),
  
  // Get app data path for sample
  getAppDataPath: () => 
    ipcRenderer.invoke('app:getDataPath'),
});

"use strict";
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/ban-ts-comment */
// @ts-nocheck
var _a = require('electron'), contextBridge = _a.contextBridge, ipcRenderer = _a.ipcRenderer;
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire ipcRenderer object
contextBridge.exposeInMainWorld('electronAPI', {
    // DB operations
    connectToDB: function (connectionString) {
        return ipcRenderer.invoke('db:connect', connectionString);
    },
    listTables: function () {
        return ipcRenderer.invoke('db:listTables');
    },
    getTableData: function (tableName, limit, offset) {
        if (limit === void 0) { limit = 10; }
        if (offset === void 0) { offset = 0; }
        return ipcRenderer.invoke('db:getTableData', tableName, limit, offset);
    },
    // For sample DB creation (kept for future)
    createSampleDB: function () {
        return ipcRenderer.invoke('db:createSample');
    },
    // Get app data path for sample
    getAppDataPath: function () {
        return ipcRenderer.invoke('app:getDataPath');
    },
});

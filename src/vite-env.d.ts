/// <reference types="vite/client" />

// Electron API types
interface ElectronAPI {
  connectToDB: (connectionString: string) => Promise<{
    success: boolean;
    path?: string;
    message?: string;
    error?: string;
  }>;
  listTables: () => Promise<Array<{ name: string }>>;
  getTableData: (tableName: string, limit?: number, offset?: number) => Promise<{
    columns: string[];
    rows: Array<{ [key: string]: unknown }>;
    rowCount: number;
    totalRows?: number;
  }>;
  createSampleDB: () => Promise<{ path: string; connectionString: string }>;
  getAppDataPath: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};

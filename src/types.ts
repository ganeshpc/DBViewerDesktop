export interface TableRow {
  [key: string]: unknown;
}

export interface DBTable {
  name: string;
}

export interface QueryResult {
  columns: string[];
  rows: TableRow[];
  rowCount: number;
  totalRows?: number;
}

export interface ConnectionResult {
  success: boolean;
  path?: string;
  message?: string;
  error?: string;
}

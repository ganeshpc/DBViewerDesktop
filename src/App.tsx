import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Storage as DatabaseIcon,
  TableChart as TableIcon,
  PlayArrow as ConnectIcon,
  Add as CreateIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { Database, Table2, Download } from 'lucide-react';

interface TableRow {
  [key: string]: unknown;
}

interface DBTable {
  name: string;
}

interface QueryResult {
  columns: string[];
  rows: TableRow[];
  rowCount: number;
  totalRows?: number;
}

interface ConnectionResult {
  success: boolean;
  path?: string;
  message?: string;
  error?: string;
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1',
    },
    secondary: {
      main: '#a5b4fc',
    },
    background: {
      default: '#0f172a',
      paper: '#1e2937',
    },
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

const App: React.FC = () => {
  // State
  const [connectionString, setConnectionString] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [tables, setTables] = useState<DBTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [openSampleDialog, setOpenSampleDialog] = useState<boolean>(false);
  const [appDataPath, setAppDataPath] = useState<string>('');
  const [connectedDBPath, setConnectedDBPath] = useState<string>('');

  // Load app data path on mount + prefill sample connection (sample DB auto-created by app)
  useEffect(() => {
    const loadAppPath = async () => {
      try {
        const path = await window.electronAPI.getAppDataPath();
        setAppDataPath(path);
        // Prefill with sample connection string (DB/tables/data already exist)
        const sampleConn = `sqlite://${path}/sample.db`;
        setConnectionString(sampleConn);
      } catch (err: unknown) {
        console.error('Failed to get app data path:', err);
      }
    };
    loadAppPath();
  }, []);

  // Connect to database
  const handleConnect = useCallback(async () => {
    if (!connectionString.trim()) {
      setError('Please enter a connection string');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result: ConnectionResult = await window.electronAPI.connectToDB(connectionString);
      if (result.success) {
        setIsConnected(true);
        setConnectedDBPath(result.path || connectionString);
        setSuccessMessage(result.message || 'Connected successfully');
        // Load tables
        const tableList = await window.electronAPI.listTables();
        setTables(tableList);
        if (tableList.length > 0) {
          setSelectedTable(tableList[0].name);
        }
      } else {
        setError(result.error || 'Connection failed');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  }, [connectionString]);

  // Load/connect to pre-created sample DB (auto-exists with tables/data on app start)
  const handleLoadSampleDB = useCallback(async () => {
    if (!appDataPath) {
      setError('App data path not ready');
      return;
    }
    const sampleConn = `sqlite://${appDataPath}/sample.db`;
    setConnectionString(sampleConn);
    setLoading(true);
    setError('');
    try {
      const connectResult: ConnectionResult = await window.electronAPI.connectToDB(sampleConn);
      if (connectResult.success) {
        setIsConnected(true);
        setConnectedDBPath(connectResult.path || sampleConn);
        setSuccessMessage('Sample database loaded (pre-created with demo data)');
        setOpenSampleDialog(true);
        // Load tables + first table data
        const tableList = await window.electronAPI.listTables();
        setTables(tableList);
        if (tableList.length > 0) {
          setSelectedTable(tableList[0].name);
          const data = await window.electronAPI.getTableData(tableList[0].name, rowsPerPage, 0);
          setTableData(data);
        }
      } else {
        setError(connectResult.error || 'Sample load failed');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load sample DB');
    } finally {
      setLoading(false);
    }
  }, [appDataPath, rowsPerPage]);

  // Load tables
  const loadTables = useCallback(async () => {
    if (!isConnected) return;
    setLoading(true);
    try {
      const tableList = await window.electronAPI.listTables();
      setTables(tableList);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Load table data
  const loadTableData = useCallback(async (tableName: string, limit: number = rowsPerPage, offset: number = page * rowsPerPage) => {
    if (!isConnected || !tableName) return;
    setLoading(true);
    setError('');
    try {
      const data = await window.electronAPI.getTableData(tableName, limit, offset);
      setTableData(data);
      setSelectedTable(tableName);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load table data');
      setTableData(null);
    } finally {
      setLoading(false);
    }
  }, [isConnected, rowsPerPage, page]);

  // Handle table select
  const handleTableSelect = (tableName: string) => {
    setPage(0);
    loadTableData(tableName, rowsPerPage, 0);
  };

  // Handle pagination change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
    if (selectedTable) {
      loadTableData(selectedTable, rowsPerPage, newPage * rowsPerPage);
    }
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRows = parseInt(event.target.value, 10);
    setRowsPerPage(newRows);
    setPage(0);
    if (selectedTable) {
      loadTableData(selectedTable, newRows, 0);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    if (selectedTable) {
      loadTableData(selectedTable);
    } else {
      loadTables();
    }
  };

  // Disconnect
  const handleDisconnect = () => {
    setIsConnected(false);
    setTables([]);
    setSelectedTable('');
    setTableData(null);
    setConnectionString('');
    setConnectedDBPath('');
    setSuccessMessage('Disconnected from database');
  };

  // Memoized table rows for render
  const tableRows = useMemo(() => {
    return tableData?.rows || [];
  }, [tableData]);

  const columns = useMemo(() => {
    return tableData?.columns || [];
  }, [tableData]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
        {/* App Bar */}
        <AppBar position="static" elevation={0} sx={{ bgcolor: '#1e2937', borderBottom: '1px solid #334155' }}>
          <Toolbar>
            <DatabaseIcon sx={{ mr: 2, color: '#6366f1' }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
              DBViewer
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={isConnected ? 'Connected' : 'Disconnected'}
                color={isConnected ? 'success' : 'default'}
                size="small"
                icon={<DatabaseIcon />}
              />
              {isConnected && (
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={handleDisconnect}
                  startIcon={<SettingsIcon />}
                >
                  Disconnect
                </Button>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          {/* Sidebar - Connection & Tables */}
          <Paper
            elevation={0}
            sx={{
              width: 280,
              borderRight: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#1e2937',
              borderRadius: 0,
            }}
          >
            {/* Connection Section */}
            <Box sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#94a3b8' }}>
                <Database size={18} />
                DATABASE CONNECTION
              </Typography>
              
              <TextField
                fullWidth
                label="Connection String"
                placeholder="sqlite:///path/to/database.db"
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                size="small"
                sx={{ mb: 2 }}
                disabled={isConnected}
                helperText="e.g. sqlite:///full/path/to/db.db"
              />

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleConnect}
                  disabled={loading || isConnected || !connectionString.trim()}
                  startIcon={<ConnectIcon />}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  {loading ? <CircularProgress size={20} /> : 'Connect'}
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleLoadSampleDB}
                  disabled={loading || isConnected || !appDataPath}
                  startIcon={<CreateIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  Load Sample
                </Button>
              </Box>

              {isConnected && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
                  Connected to: {connectedDBPath ? connectedDBPath.split('/').pop() : connectionString.split('/').pop()}
                </Alert>
              )}
            </Box>

            <Divider sx={{ borderColor: '#334155' }} />

            {/* Tables Section */}
            <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#94a3b8' }}>
                  <Table2 size={18} />
                  TABLES
                </Typography>
                {isConnected && (
                  <Tooltip title="Refresh tables">
                    <IconButton size="small" onClick={loadTables} disabled={loading}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              {isConnected ? (
                <List sx={{ flexGrow: 1, overflow: 'auto', bgcolor: '#0f172a', borderRadius: 1 }}>
                  {tables.length === 0 ? (
                    <ListItem>
                      <ListItemText primary="No tables found" sx={{ color: '#64748b' }} />
                    </ListItem>
                  ) : (
                    tables.map((table) => (
                      <ListItemButton
                        key={table.name}
                        selected={selectedTable === table.name}
                        onClick={() => handleTableSelect(table.name)}
                        sx={{
                          '&.Mui-selected': {
                            bgcolor: '#312e81',
                            '&:hover': { bgcolor: '#4338ca' },
                          },
                        }}
                      >
                        <TableIcon sx={{ mr: 2, color: '#6366f1' }} />
                        <ListItemText 
                          primary={table.name}
                          primaryTypographyProps={{ fontWeight: selectedTable === table.name ? 600 : 400 }}
                        />
                      </ListItemButton>
                    ))
                  )}
                </List>
              ) : (
                <Box sx={{ 
                  flexGrow: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#64748b',
                  textAlign: 'center',
                  p: 2,
                }}>
                  <Typography variant="body2">
                    Connect to a database to view tables
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Footer info */}
            <Box sx={{ p: 2, borderTop: '1px solid #334155', bgcolor: '#1e2937' }}>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                Sample DB (auto-created):
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', wordBreak: 'break-all' }}>
                {appDataPath ? `${appDataPath}/sample.db` : 'Loading...'}
              </Typography>
            </Box>
          </Paper>

          {/* Main Content */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Table Header */}
            <Box sx={{ p: 3, borderBottom: '1px solid #334155', bgcolor: '#1e2937', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#e2e8f0' }}>
                  {selectedTable ? selectedTable : 'Select a table'}
                </Typography>
                {selectedTable && tableData && (
                  <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                    Showing {tableData.rowCount} of {tableData.totalRows || '?'} rows • First {rowsPerPage} rows configurable
                  </Typography>
                )}
              </Box>

              {selectedTable && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleRefresh}
                    startIcon={<RefreshIcon />}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                  <Tooltip title="Export CSV (coming soon)">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Download size={18} />}
                      disabled
                    >
                      Export
                    </Button>
                  </Tooltip>
                </Box>
              )}
            </Box>

            {/* Table Area - fills complete window space */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3, overflow: 'hidden', bgcolor: '#0f172a' }}>
              {loading && !tableData && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {successMessage && !error && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
                  {successMessage}
                </Alert>
              )}

              {!isConnected ? (
                <Paper
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 6,
                    textAlign: 'center',
                    bgcolor: '#1e2937',
                    border: '1px dashed #475569',
                    maxWidth: 500,
                    mx: 'auto',
                  }}
                >
                  <DatabaseIcon sx={{ fontSize: 60, color: '#475569', mb: 3 }} />
                  <Typography variant="h6" sx={{ mb: 1, color: '#e2e8f0' }}>
                    Welcome to DBViewer
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#94a3b8', mb: 4 }}>
                    Sample DB is pre-created with demo data/tables (users, products, orders).
                    Enter connection string or click below to load sample.
                    <br />
                    <strong>Example:</strong> sqlite:///path/to/your/database.db
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleLoadSampleDB}
                    startIcon={<CreateIcon />}
                    sx={{ textTransform: 'none', px: 4 }}
                    disabled={!appDataPath}
                  >
                    Load Sample Database
                  </Button>
                  <Typography variant="caption" sx={{ display: 'block', mt: 3, color: '#64748b' }}>
                    Sample DB auto-exists in app data dir
                  </Typography>
                </Paper>
              ) : !selectedTable ? (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <TableIcon sx={{ fontSize: 80, color: '#475569', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#94a3b8' }}>
                    Select a table from the sidebar
                  </Typography>
                </Box>
              ) : tableData && columns.length > 0 ? (
                <Paper elevation={0} sx={{ bgcolor: '#1e2937', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          {columns.map((col) => (
                            <TableCell
                              key={col}
                              sx={{
                                bgcolor: '#1e2937',
                                color: '#e2e8f0',
                                fontWeight: 600,
                                borderBottom: '2px solid #334155',
                                textTransform: 'uppercase',
                                fontSize: '0.75rem',
                                letterSpacing: '0.5px',
                              }}
                            >
                              {col}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={columns.length} align="center" sx={{ py: 8, color: '#64748b' }}>
                              No rows found in this table
                            </TableCell>
                          </TableRow>
                        ) : (
                          tableRows.map((row, rowIndex) => (
                            <TableRow
                              key={rowIndex}
                              hover
                              sx={{
                                '&:nth-of-type(odd)': { bgcolor: '#0f172a' },
                                '&:hover': { bgcolor: '#312e81' },
                              }}
                            >
                              {columns.map((col) => (
                                <TableCell
                                  key={col}
                                  sx={{
                                    color: '#e2e8f0',
                                    borderBottom: '1px solid #334155',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: 200,
                                  }}
                                >
                                  {row[col] !== null && row[col] !== undefined ? String(row[col]) : 'NULL'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Pagination */}
                  {tableData.totalRows !== undefined && (
                    <TablePagination
                      component="div"
                      count={tableData.totalRows}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={[5, 10, 20, 50]}
                      sx={{
                        bgcolor: '#1e2937',
                        color: '#e2e8f0',
                        borderTop: '1px solid #334155',
                      }}
                    />
                  )}
                </Paper>
              ) : (
                <Box sx={{ textAlign: 'center', mt: 10, color: '#64748b' }}>
                  <Typography>No data available. Select a table to view rows.</Typography>
                </Box>
              )}
            </Box>

            {/* Status Bar */}
            <Box
              sx={{
                p: 1.5,
                bgcolor: '#1e2937',
                borderTop: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                fontSize: '0.75rem',
                color: '#64748b',
              }}
            >
              <Box>SQLite • First phase demo</Box>
              <Box>Rows limit: configurable</Box>
              {isConnected && <Box>DB: {connectionString ? connectionString.split('/').pop() : 'sample.db'}</Box>}
              <Box sx={{ ml: 'auto' }}>Production ready • Electron + React + MUI</Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Sample DB Dialog */}
      <Dialog open={openSampleDialog} onClose={() => { setOpenSampleDialog(false); setSuccessMessage(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1e2937', color: '#e2e8f0' }}>
          Sample Database Loaded
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#0f172a', pt: 3 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            Sample SQLite DB pre-created with demo tables/data (no manual creation needed):
          </Alert>
          <Box sx={{ bgcolor: '#1e2937', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem', color: '#a5b4fc', mb: 2 }}>
            {appDataPath}/sample.db
          </Box>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
            Connection string used:
          </Typography>
          <Box sx={{ bgcolor: '#1e2937', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem', color: '#e0e7ff' }}>
            sqlite://{appDataPath}/sample.db
          </Box>
          <Typography variant="body2" sx={{ mt: 3, color: '#94a3b8' }}>
            Tables: users, products, orders (with sample rows). Select table to view data.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1e2937' }}>
          <Button onClick={() => setOpenSampleDialog(false)} variant="contained">
            Start exploring!
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for messages */}
      <Snackbar
        open={!!successMessage && !openSampleDialog}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default App;

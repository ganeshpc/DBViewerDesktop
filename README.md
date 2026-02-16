# DBViewer

A modern desktop application for viewing database data without writing SQL. Built with Electron, React, TypeScript, and Material-UI.

## Features (Phase 1)
- Connect to SQLite databases using connection strings (e.g., `sqlite:///path/to/db.db`)
- List all tables in the database
- View first N rows of selected table (configurable rows per page: 5,10,20,50)
- Built-in sample database with demo tables (users, products, orders) for testing
- Clean, modern dark-themed UI
- Pagination support
- Production-grade code with TypeScript, context isolation, and security best practices

## Quick Start

### Prerequisites
- Node.js >= 18
- npm

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
This starts the Vite dev server + Electron app.

### Build for Production
```bash
npm run build
```
Outputs to `release/` directory (AppImage for Linux, NSIS for Windows, etc.).

### Sample Database
- Automatically created on app launch (with tables: users, products, orders + demo data).
- No manual creation needed. Prefilled in UI; click "Load Sample" to connect.
- Located in app user data dir (e.g. `~/Library/Application Support/dbviewer/sample.db` on macOS).

## Connection Strings
Currently supports SQLite:
- `sqlite:///absolute/path/to/database.db`
- Or just the absolute file path (auto-detected)
- Sample: `sqlite://${appDataPath}/sample.db`

Future phases will support PostgreSQL, MySQL, etc. via full connection strings.

## Project Structure
- `src/` - React UI components (MUI based)
- `electron/` - Main process, preload, DB logic with better-sqlite3
- `dist/` - Built renderer
- `dist-electron/` - Built main/preload

## Tech Stack
- **Frontend**: React 19 + TypeScript + Material-UI (dark theme)
- **Desktop**: Electron (secure contextIsolation, IPC)
- **Database**: better-sqlite3 (embedded SQLite)
- **Build**: Vite + electron-builder
- **Styling**: MUI + custom dark theme for modern look

## Security & Best Practices
- Context Isolation enabled
- Sandboxed renderer
- IPC for all DB operations (no direct node in renderer)
- Type safety with TS interfaces
- Error handling and loading states
- Production builds with packaging

## Future Enhancements
- SQL-free query builder
- Support for more DBs (Postgres, MySQL, MSSQL)
- Data editing/insert
- Charts/visualizations
- Export to CSV/Excel

All code follows production standards: proper error handling, TypeScript strict, no unused deps, modern React patterns.


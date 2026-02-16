"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnection = exports.createSampleDatabase = void 0;
var better_sqlite3_1 = __importDefault(require("better-sqlite3"));
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var createSampleDatabase = function (dbPath) {
    if (fs_1.default.existsSync(dbPath)) {
        return dbPath;
    }
    var db = new better_sqlite3_1.default(dbPath);
    // Create sample tables (5 total)
    db.exec("\n    CREATE TABLE IF NOT EXISTS users (\n      id INTEGER PRIMARY KEY,\n      name TEXT NOT NULL,\n      email TEXT UNIQUE,\n      age INTEGER,\n      created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n    );\n\n    CREATE TABLE IF NOT EXISTS products (\n      id INTEGER PRIMARY KEY,\n      name TEXT NOT NULL,\n      price REAL,\n      category TEXT,\n      stock INTEGER DEFAULT 0,\n      created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n    );\n\n    CREATE TABLE IF NOT EXISTS orders (\n      id INTEGER PRIMARY KEY,\n      user_id INTEGER,\n      product_id INTEGER,\n      quantity INTEGER,\n      total_amount REAL,\n      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,\n      FOREIGN KEY (user_id) REFERENCES users(id),\n      FOREIGN KEY (product_id) REFERENCES products(id)\n    );\n\n    CREATE TABLE IF NOT EXISTS categories (\n      id INTEGER PRIMARY KEY,\n      name TEXT NOT NULL,\n      description TEXT,\n      created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n    );\n\n    CREATE TABLE IF NOT EXISTS reviews (\n      id INTEGER PRIMARY KEY,\n      product_id INTEGER,\n      user_id INTEGER,\n      rating INTEGER,\n      comment TEXT,\n      review_date DATETIME DEFAULT CURRENT_TIMESTAMP,\n      FOREIGN KEY (product_id) REFERENCES products(id),\n      FOREIGN KEY (user_id) REFERENCES users(id)\n    );\n\n    CREATE TABLE IF NOT EXISTS inventory (\n      id INTEGER PRIMARY KEY,\n      product_id INTEGER,\n      location TEXT,\n      quantity INTEGER,\n      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,\n      FOREIGN KEY (product_id) REFERENCES products(id)\n    );\n  ");
    // Insert 40+ rows per table
    var insertUser = db.prepare('INSERT INTO users (name, email, age) VALUES (?, ?, ?)');
    for (var i = 1; i <= 40; i++) {
        insertUser.run("User ".concat(i), "user".concat(i, "@example.com"), 20 + (i % 50));
    }
    var insertProduct = db.prepare('INSERT INTO products (name, price, category, stock) VALUES (?, ?, ?, ?)');
    for (var i = 1; i <= 40; i++) {
        insertProduct.run("Product ".concat(i), 10 + i * 5, ['Electronics', 'Books', 'Clothing'][i % 3], 50 + i * 2);
    }
    var insertOrder = db.prepare('INSERT INTO orders (user_id, product_id, quantity, total_amount) VALUES (?, ?, ?, ?)');
    for (var i = 1; i <= 40; i++) {
        insertOrder.run(1 + (i % 40), 1 + (i % 40), 1 + (i % 10), 100 + i * 10);
    }
    var insertCategory = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    for (var i = 1; i <= 40; i++) {
        insertCategory.run("Category ".concat(i), "Description for category ".concat(i));
    }
    var insertReview = db.prepare('INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)');
    for (var i = 1; i <= 40; i++) {
        insertReview.run(1 + (i % 40), 1 + (i % 40), 1 + (i % 5), "Review comment ".concat(i));
    }
    var insertInventory = db.prepare('INSERT INTO inventory (product_id, location, quantity) VALUES (?, ?, ?)');
    for (var i = 1; i <= 40; i++) {
        insertInventory.run(1 + (i % 40), ['Warehouse A', 'Store B', 'Online'][i % 3], 100 + i * 3);
    }
    db.close();
    return dbPath;
};
exports.createSampleDatabase = createSampleDatabase;
var getConnection = function (connectionString) {
    // Support SQLite connection strings like "sqlite:///absolute/path/to/db.db" or just path
    var dbPath = connectionString;
    if (connectionString.startsWith('sqlite:')) {
        // Extract path, support sqlite:// or sqlite:/// 
        dbPath = connectionString.replace(/^sqlite:\/\//, '').replace(/^sqlite:/, '');
        // Make absolute if relative
        if (!path_1.default.isAbsolute(dbPath)) {
            dbPath = path_1.default.resolve(dbPath);
        }
    }
    return dbPath;
};
exports.getConnection = getConnection;

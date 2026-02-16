import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export const createSampleDatabase = (dbPath: string): string => {
  if (fs.existsSync(dbPath)) {
    return dbPath;
  }

  const db = new Database(dbPath);

  // Create sample tables (5 total)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      age INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL,
      category TEXT,
      stock INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      total_amount REAL,
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY,
      product_id INTEGER,
      user_id INTEGER,
      rating INTEGER,
      comment TEXT,
      review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY,
      product_id INTEGER,
      location TEXT,
      quantity INTEGER,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  // Insert 40+ rows per table
  const insertUser = db.prepare('INSERT INTO users (name, email, age) VALUES (?, ?, ?)');
  for (let i = 1; i <= 40; i++) {
    insertUser.run(`User ${i}`, `user${i}@example.com`, 20 + (i % 50));
  }

  const insertProduct = db.prepare('INSERT INTO products (name, price, category, stock) VALUES (?, ?, ?, ?)');
  for (let i = 1; i <= 40; i++) {
    insertProduct.run(`Product ${i}`, 10 + i * 5, ['Electronics', 'Books', 'Clothing'][i % 3], 50 + i * 2);
  }

  const insertOrder = db.prepare('INSERT INTO orders (user_id, product_id, quantity, total_amount) VALUES (?, ?, ?, ?)');
  for (let i = 1; i <= 40; i++) {
    insertOrder.run(1 + (i % 40), 1 + (i % 40), 1 + (i % 10), 100 + i * 10);
  }

  const insertCategory = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
  for (let i = 1; i <= 40; i++) {
    insertCategory.run(`Category ${i}`, `Description for category ${i}`);
  }

  const insertReview = db.prepare('INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)');
  for (let i = 1; i <= 40; i++) {
    insertReview.run(1 + (i % 40), 1 + (i % 40), 1 + (i % 5), `Review comment ${i}`);
  }

  const insertInventory = db.prepare('INSERT INTO inventory (product_id, location, quantity) VALUES (?, ?, ?)');
  for (let i = 1; i <= 40; i++) {
    insertInventory.run(1 + (i % 40), ['Warehouse A', 'Store B', 'Online'][i % 3], 100 + i * 3);
  }

  db.close();
  return dbPath;
};

export const getConnection = (connectionString: string): string => {
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

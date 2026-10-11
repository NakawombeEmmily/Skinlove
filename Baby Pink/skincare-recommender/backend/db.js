const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || './skincare.db';
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      skinType TEXT,
      location TEXT,
      lat REAL,
      lng REAL,
      isAdmin INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      skinTypes TEXT,
      category TEXT,
      brand TEXT,
      benefits TEXT,
      rating REAL DEFAULT 0,
      reviews INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Stores table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      lat REAL,
      lng REAL,
      phone TEXT,
      hours TEXT,
      rating REAL DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Skin Analysis table
  db.exec(`
    CREATE TABLE IF NOT EXISTS skinAnalyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      skinType TEXT,
      quizAnswers TEXT,
      imageUrl TEXT,
      oilLevel INTEGER,
      sensitivity INTEGER,
      hydration INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Usage table
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      feature TEXT,
      usageCount INTEGER DEFAULT 1,
      lastUsed DATETIME DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  console.log('✅ Database initialized successfully');
}

initializeDatabase();

module.exports = db;

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'securebank.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    fullname TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    balance REAL DEFAULT 0.00,
    failed_attempts INTEGER DEFAULT 0,
    locked INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

module.exports = db;

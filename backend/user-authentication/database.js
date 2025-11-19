// backend/user-authentication/database.js
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// By default, use the shared DB so all services see the same data file.
const dbPath =
  process.env.AUTH_DB_PATH ||
  path.join(__dirname, '../shared-db/database.sqlite');

sqlite3.verbose();
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite DB', err);
  } else {
    console.log('Connected to SQLite at', dbPath);
  }
});

// Create users table if it does not exist
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,
    (err) => {
      if (err) {
        console.error('Error creating users table', err);
      } else {
        console.log('Ensured users table exists');
      }
    }
  );
});

export default db;

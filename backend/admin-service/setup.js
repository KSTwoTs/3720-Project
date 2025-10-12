// === Task 1.2 ===
// Ensures SQLite database and schema exist on startup.
// Task 5.2: keeps DB consistent by re-running schema creation idempotently.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Shared database path (used by admin + client services)
const dbPath = path.join(__dirname, '../shared-db/database.sqlite');
const initSQLPath = path.join(__dirname, '../shared-db/init.sql');

// Create folder if missing (Task 6: avoids runtime errors)
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

// Open SQLite connection and run schema file
const db = new sqlite3.Database(dbPath);
const initScript = fs.readFileSync(initSQLPath, 'utf8');

// IF NOT EXISTS makes it idempotent (Task 5.2)
db.exec(initScript, (err) => {
  if (err) console.error('DB init error:', err.message);
  else console.log('DB initialized/verified.');
});

db.close();

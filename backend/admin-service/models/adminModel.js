// === Task 1.2 ===
// Data access layer for event creation
// Task 5.2: uses parameterized SQL to maintain consistent state
// Task 6: single responsibility and minimal side effects

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../shared-db/database.sqlite');
const db = new sqlite3.Database(dbPath);

// Task 1.2: Insert validated event data into shared DB
export function createEvent({ name, date, tickets }) {
  return new Promise((resolve, reject) => {
    const stmt = `INSERT INTO events (name, date, tickets) VALUES (?, ?, ?)`;
    db.run(stmt, [name, date, tickets], function (err) {
      if (err) {
        console.error('SQL INSERT error:', err.message);
        return reject(err); // triggers controller 500
      }
      // Return newly created event record for response payload
      resolve({ id: this.lastID, name, date, tickets });
    });
  });
}

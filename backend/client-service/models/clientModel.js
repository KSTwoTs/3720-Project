// Task 2.1 — Data access for listing events
// Task 2.2 — Purchase (decrement tickets)
// Task 2.3 — DB consistency under load (atomic updates)
// Task 5.1 — Safe concurrent updates (transaction prevents race conditions)
// Task 5.2 — Consistent DB state (no negative tickets)
// Task 6   — Code quality (parameterized SQL, small focused functions)

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../shared-db/database.sqlite');

const db = new sqlite3.Database(dbPath);

// Task 2.1: Return full event list; handles empty DB ([]) gracefully
export function getAllEvents() {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, name, date, tickets FROM events ORDER BY date ASC, id ASC',
      [],
      (err, rows) => (err ? reject(err) : resolve(rows || []))
    );
  });
}

// Task 2.2/2.3 + Task 5.1/5.2: Atomic decrement using a transaction
export function purchaseTicket(eventId) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN IMMEDIATE TRANSACTION'); // obtains write lock up front

      // Read current stock
      db.get('SELECT tickets FROM events WHERE id = ?', [eventId], (err, row) => {
        if (err) {
          db.run('ROLLBACK');
          return reject(err);
        }
        if (!row) {
          db.run('ROLLBACK');
          return reject(new Error('Event not found')); // 404 in controller
        }
        if (row.tickets <= 0) {
          db.run('ROLLBACK');
          return reject(new Error('Sold out')); // 409 in controller
        }

        // Decrement by 1
        db.run('UPDATE events SET tickets = tickets - 1 WHERE id = ?', [eventId], (err2) => {
          if (err2) {
            db.run('ROLLBACK');
            return reject(err2);
          }

          // Commit final state
          db.run('COMMIT', (err3) => {
            if (err3) return reject(err3);
            resolve({ eventId, remaining: row.tickets - 1 });
          });
        });
      });
    });
  });
}

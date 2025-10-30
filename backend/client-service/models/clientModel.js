// controllers/models/clientModel.js
// Step 2: Atomic purchase using a single SQLite transaction and optional guarded UPDATE.

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path points to shared DB (kept consistent with your project layout)
const dbPath = path.join(__dirname, '../../shared-db/database.sqlite');
const db = new sqlite3.Database(dbPath);

// List all events for the client app
export function getAllEvents() {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, name, date, tickets FROM events ORDER BY date ASC, id ASC',
      [],
      (err, rows) => (err ? reject(err) : resolve(rows || []))
    );
  });
}

/**
 * Atomically purchase `qty` tickets for `eventId`.
 * Uses BEGIN IMMEDIATE to obtain the write lock up front, then:
 *  1) SELECT tickets
 *  2) Validate availability
 *  3) UPDATE tickets = tickets - qty
 *  4) COMMIT
 * If anything fails → ROLLBACK and reject with a descriptive Error.
 */
export function purchaseTicket(eventId, qty = 1) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN IMMEDIATE TRANSACTION', (beginErr) => {
        if (beginErr) return reject(beginErr);

        db.get(
          'SELECT tickets FROM events WHERE id = ?',
          [eventId],
          (selErr, row) => {
            if (selErr) {
              return db.run('ROLLBACK', () => reject(selErr));
            }
            if (!row) {
              return db.run('ROLLBACK', () => reject(new Error('Event not found')));
            }
            if (row.tickets <= 0 || row.tickets < qty) {
              const reason = row.tickets <= 0 ? 'Sold out' : 'Not enough tickets';
              return db.run('ROLLBACK', () => reject(new Error(reason)));
            }

            // Guarded UPDATE to prevent underflow even if concurrent checks slipped (belt & suspenders)
            db.run(
              'UPDATE events SET tickets = tickets - ? WHERE id = ? AND tickets >= ?',
              [qty, eventId, qty],
              function (updErr) {
                if (updErr) {
                  return db.run('ROLLBACK', () => reject(updErr));
                }
                if (this.changes === 0) {
                  // Someone else grabbed them in between the SELECT and UPDATE
                  return db.run('ROLLBACK', () => reject(new Error('Not enough tickets')));
                }

                db.run('COMMIT', (comErr) => {
                  if (comErr) {
                    return db.run('ROLLBACK', () => reject(comErr));
                  }
                  resolve({ eventId, remaining: row.tickets - qty });
                });
              }
            );
          }
        );
      });
    });
  });
}

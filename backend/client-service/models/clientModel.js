import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../shared-db/database.sqlite');


// Open in serialized mode (default) to ensure ordered execution
const db = new sqlite3.Database(dbPath);


export function getAllEvents() {
return new Promise((resolve, reject) => {
db.all('SELECT id, name, date, tickets FROM events ORDER BY date ASC, id ASC', [], (err, rows) => {
if (err) return reject(err);
resolve(rows || []);
});
});
}


export function purchaseTicket(eventId) {
// Use a transaction to guarantee atomicity and avoid overselling
return new Promise((resolve, reject) => {
db.serialize(() => {
db.run('BEGIN IMMEDIATE TRANSACTION');


db.get('SELECT tickets FROM events WHERE id = ?', [eventId], (err, row) => {
if (err) {
db.run('ROLLBACK');
return reject(err);
}
if (!row) {
db.run('ROLLBACK');
return reject(new Error('Event not found'));
}
if (row.tickets <= 0) {
db.run('ROLLBACK');
return reject(new Error('Sold out'));
}


db.run('UPDATE events SET tickets = tickets - 1 WHERE id = ?', [eventId], function (err2) {
if (err2) {
db.run('ROLLBACK');
return reject(err2);
}
db.run('COMMIT', (err3) => {
if (err3) return reject(err3);
resolve({ eventId, remaining: row.tickets - 1 });
});
});
});
});
});
}

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../shared-db/database.sqlite');


const db = new sqlite3.Database(dbPath);


export function createEvent({ name, date, tickets }) {
return new Promise((resolve, reject) => {
const stmt = `INSERT INTO events (name, date, tickets) VALUES (?, ?, ?)`;
db.run(stmt, [name, date, tickets], function (err) {
if (err) return reject(err);
resolve({ id: this.lastID, name, date, tickets });
});
});
}

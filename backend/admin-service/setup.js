import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const dbPath = path.join(__dirname, '../shared-db/database.sqlite');
const initSQLPath = path.join(__dirname, '../shared-db/init.sql');


if (!fs.existsSync(path.dirname(dbPath))) {
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}


const db = new sqlite3.Database(dbPath);
const initScript = fs.readFileSync(initSQLPath, 'utf8');


db.exec(initScript, (err) => {
if (err) console.error('DB init error:', err.message);
else console.log('DB initialized/verified.');
});


db.close();

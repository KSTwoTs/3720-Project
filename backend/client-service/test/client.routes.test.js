import request from 'supertest';
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

let app;
let clientRoutes;     // <-- will hold the router
let TMP_DB;

// helper to exec SQL
function execSql(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });
}

beforeAll(async () => {
  // 1) temp DB path + env for the model
  TMP_DB = path.join(process.cwd(), `test-${Date.now()}.sqlite`);
  process.env.DB_PATH = TMP_DB;

  // 2) apply schema from init.sql
  const schemaPath = path.resolve(__dirname, '../../shared-db/init.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const db = new sqlite3.Database(TMP_DB);
  await execSql(db, schema);
  db.close();

  // 3) IMPORT THE ROUTER AFTER DB_PATH IS SET
  //    ensure .js extension and take the default export
  clientRoutes = (await import('../routes/clientRoutes.js')).default;

  // 4) build app
  app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', clientRoutes);
});

afterAll(() => {
  try { fs.unlinkSync(TMP_DB); } catch {}
});

describe('Client /api/events', () => {
  test('GET list returns array', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    const body = res.body?.events ?? res.body;
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST purchase decrements tickets or returns 409 when sold out', async () => {
    const db = new sqlite3.Database(TMP_DB);
    await new Promise(r =>
      db.run(`INSERT INTO events (name,date,tickets) VALUES ('Test Small','2025-11-20',2)`, [], r)
    );
    const row = await new Promise((resolve) =>
      db.get(`SELECT id FROM events WHERE name='Test Small'`, [], (e, r) => resolve(r))
    );
    const id = row.id;

    const a = await request(app).post(`/api/events/${id}/purchase`);
    expect(a.status).toBe(200);

    const b = await request(app).post(`/api/events/${id}/purchase`);
    expect(b.status).toBe(200);

    const c = await request(app).post(`/api/events/${id}/purchase`);
    expect([409, 400]).toContain(c.status);
    db.close();
  });

  test('Concurrent purchases do not oversell', async () => {
    const db = new sqlite3.Database(TMP_DB);
    await new Promise(r =>
      db.run(`INSERT INTO events (name,date,tickets) VALUES ('Race Test','2025-11-21',1)`, [], r)
    );
    const row = await new Promise((resolve) =>
      db.get(`SELECT id FROM events WHERE name='Race Test'`, [], (e, r) => resolve(r))
    );
    const id = row.id;

    const [r1, r2] = await Promise.all([
      request(app).post(`/api/events/${id}/purchase`),
      request(app).post(`/api/events/${id}/purchase`),
    ]);
    expect([r1.status, r2.status].sort()).toEqual([200, 409].sort());
    db.close();
  });
});

import { z } from 'zod';
import sqlite3 from 'sqlite3';
import path from 'path';
import cryptoJS from 'crypto-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new sqlite3.Database(path.join(__dirname, '../../shared-db/database.sqlite'));

const EventSchema = z.object({
  name: z.string().min(3).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  tickets: z.number().int().nonnegative(),
  location: z.string().max(160).optional(),
  description: z.string().max(2000).optional()
});

function sha256(s) { return cryptoJS.SHA256(s).toString(); }

export async function postEvent(req, res) {
  try {
    // 1) Validate
    const parsed = EventSchema.safeParse({
      name: req.body?.name,
      date: req.body?.date,
      tickets: Number(req.body?.tickets),
      location: req.body?.location,
      description: req.body?.description
    });
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.issues });
    }

    // 2) Idempotency (optional but recommended)
    const idemKey = req.header('Idempotency-Key');
    const bodyHash = sha256(JSON.stringify(parsed.data));
    if (idemKey) {
      const found = await selectOne('SELECT event_id, request_hash FROM idempotency WHERE key = ?', [idemKey]);
      if (found) {
        if (found.request_hash !== bodyHash) {
          return res.status(409).json({ error: 'Idempotency key reuse with different payload' });
        }
        const ev = await selectOne('SELECT * FROM events WHERE id = ?', [found.event_id]);
        return res.status(201).json({ message: 'Event created (replay)', event: ev });
      }
    }

    // 3) Create with UNIQUE(name,date) protection
    const { name, date, tickets, location, description } = parsed.data;

    // transaction
    await exec('BEGIN IMMEDIATE TRANSACTION');
    try {
      // Try insert
      const eventId = await runAndGetId(
        `INSERT INTO events (name, date, tickets, location, description, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, date, tickets, location || null, description || null, req.organizer?.id || null]
      );

      if (idemKey) {
        await run(`INSERT INTO idempotency(key, request_hash, event_id) VALUES (?, ?, ?)`,
                  [idemKey, bodyHash, eventId]);
      }

      await run(`INSERT INTO event_audit(actor_org_id, action, event_id, payload, ip)
                 VALUES (?, 'CREATE', ?, ?, ?)`,
                [req.organizer?.id || null, eventId, JSON.stringify(parsed.data), req.ip]);

      await exec('COMMIT');
      const ev = await selectOne('SELECT * FROM events WHERE id = ?', [eventId]);
      return res.status(201).json({ message: 'Event created', event: ev });

    } catch (e) {
      await exec('ROLLBACK');
      // Handle uniqueness nicely
      if (String(e?.message || '').includes('UNIQUE constraint failed')) {
        const ev = await selectOne('SELECT * FROM events WHERE name=? AND date=?', [name, date]);
        return res.status(409).json({ error: 'Event already exists for that name and date', event: ev });
      }
      throw e;
    }

  } catch (err) {
      console.error('CREATE EVENT FAILED:', err?.message, err);
  // TEMP: echo details to client so we can see the exact SQLite error
  return res.status(500).json({ error: 'Server error creating event', details: err?.message });
  }
}

/* --- tiny sqlite helpers (promisified) --- */
function run(sql, params=[]) { 
  return new Promise((res, rej) => db.run(sql, params, function(err){ err?rej(err):res(this); }));
}
function exec(sql){ return new Promise((res, rej)=> db.exec(sql, (err)=> err?rej(err):res())); }
function selectOne(sql, params=[]){
  return new Promise((res, rej)=> db.get(sql, params, (err,row)=> err?rej(err):res(row)));
}
async function runAndGetId(sql, params=[]){
  const r = await run(sql, params); return r.lastID;
}

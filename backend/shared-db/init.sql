-- backend/shared-db/init.sql
CREATE TABLE IF NOT EXISTS organizers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  api_key_hash TEXT NOT NULL, -- store a hash, not the raw key
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date TEXT NOT NULL,               -- ISO 8601: YYYY-MM-DD
  tickets INTEGER NOT NULL CHECK (tickets >= 0),
  location TEXT,
  description TEXT,
  created_by INTEGER,               -- organizers.id
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(name, date),               -- prevents accidental duplicates
  FOREIGN KEY (created_by) REFERENCES organizers(id)
);

CREATE TABLE IF NOT EXISTS idempotency (
  key TEXT PRIMARY KEY,             -- Idempotency-Key header value
  request_hash TEXT NOT NULL,       -- hash of the body (optional, to detect mismatches)
  event_id INTEGER,                 -- created resource
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS event_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_org_id INTEGER,
  action TEXT NOT NULL,             -- CREATE/UPDATE/DELETE
  event_id INTEGER,
  payload TEXT,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Task 1.2 — Database schema creation and persistence
--   • Correct events table, persisted in shared SQLite file used by both services
-- Task 5.2 — Consistent DB state
--   • Constraints help prevent bad data (e.g., negative tickets)
-- Task 6 — Code quality (clear schema, minimal but explicit constraints)

CREATE TABLE IF NOT EXISTS organizers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  api_key_hash TEXT NOT NULL, -- store a hash, not the raw key
  is_active INTEGER NOT NULL DEFAULT 1
);

-- Core events table consumed by both admin-service and client-service
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

-- Idempotency support (optional): safely retry “create event” without dupes
CREATE TABLE IF NOT EXISTS idempotency (
  key TEXT PRIMARY KEY,             -- Idempotency-Key header value
  request_hash TEXT NOT NULL,       -- hash of the body (optional, to detect mismatches)
  event_id INTEGER,                 -- created resource
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Simple audit trail for admin mutations (CREATE/UPDATE/DELETE)
CREATE TABLE IF NOT EXISTS event_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_org_id INTEGER,
  action TEXT NOT NULL,             -- CREATE/UPDATE/DELETE
  event_id INTEGER,
  payload TEXT,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

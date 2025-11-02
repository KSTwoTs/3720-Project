# TigerTix

A minimal two-service ticketing app:

- **Admin Service (Express, 5001):** create events (secured by API key).
- **Client Service (Express, 6001):** list events and purchase tickets (transactional).
- **Frontend (React + Vite, 5173):** browse events, buy tickets with accessible UI.
- **Shared SQLite DB:** single source of truth for both services.

---

## 1. Prerequisites

- Node.js ≥ 18  
- npm ≥ 9  
- Git (optional, for cloning)  
- VS Code (recommended)  
- Postman (optional, for testing APIs)  
- SQLite CLI (optional, for inspecting the DB)

---

## 2. Project Structure
```text
TigerTix/
├── backend/
│ ├── shared-db/
│ │ ├── database.sqlite # created automatically if missing
│ │ └── init.sql # DB schema
│ ├── admin-service/
│ │ ├── controllers/
│ │ │ └── adminController.js
│ │ ├── middleware/
│ │ │ └── apiKeyAuth.js
│ │ ├── models/
│ │ │ └── adminModel.js
│ │ ├── routes/
│ │ │ └── adminRoutes.js
│ │ ├── tests/
│ │ │ └── admin.routes.test.js
│ │ ├── package-lock.json
│ │ ├── package.json
│ │ ├── server.js
│ │ ├── setup.js
│ │ └── .env # ADMIN_API_KEY=..., PORT=5001
│ ├── client-service/
│ │ ├── controllers/
│ │ │ └── clientController.js
│ │ ├── models/
│ │ │ └── clientModel.js
│ │ ├── routes/
│ │ │ └── clientRoutes.js
│ │ ├── tests/
│ │ │ └── client.routes.test.js
│ │ ├── package-lock.json
│ │ ├── package.json
│ │ └── server.js
│ ├── llm-service/
│ │ ├── tests/
│ │ │ └── llm.routes.test.js
│ │ ├── package-lock.json
│ │ ├── package.json
│ │ ├── server.js
│ │ └── .env
├── frontend/
│ │ ├── public/ 
│ │ ├── src/
│ │ │ ├── components/
│ │ │ │ ├── tests/
│ │ │ │ │ ├── ChatAssistant.test.jsx
│ │ │ │ │ └── EventList.test.jsx
│ │ │ │ ├── ChatAssistant.jsx
│ │ │ │ └── EventList.jsx
│ │ │ ├── lib/
│ │ │ │ └── voice.js
│ │ │ ├── App.css
│ │ │ ├── App.jsx
│ │ │ ├── App.test.jsx
│ │ │ ├── Index.css
│ │ │ ├── Index.jsx
│ │ │ ├── reportWebVitals.js
│ │ │ ├── setupTests.js
│ │ │ └── styles.css
│ ├── index.html
│ ├── package-lock.json
│ ├── package.json
│ └── vite.config.js
```

**Ports:** Admin 5001 | Client 6001 | LLM 7001 | Frontend 5173

---

## 3. Getting Started (VS Code)

Open the `TigerTix/` folder in **VS Code**.

Open **four terminals** (Terminal → New Terminal).

If running on Windows PowerShell, temporarily allow scripts:
```bash
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
## 4. Install & Run — Back-end services

Terminal 1 **admin-service**
```
cd backend/admin-service
npm install
```

In backend/admin-service/.env:
```
ADMIN_API_KEY=super-secret-key-change-me
PORT=5001
```

Start the server:
```
npm start
```

You should see:
```
Admin service running on port 5001
DB initialized/verified.
```

Terminal 2 **client-service**
```
cd backend/client-service
npm install
npm start
```

You should see:
```
Client service running on port 6001
```

Terminal 3 **llm-service**
```
cd backend/llm-service
npm install
npm start
```

## 5. Install & Run — Frontend (5173)

Terminal 4
```
cd frontend
npm install
npm run dev
```

Open the printed URL (usually http://localhost:5173).
You’ll see a list of events (empty at first) and a Buy Ticket button per event.

## 6. Using the APIs (Postman / cURL)
7.1 Create an event (Admin, requires API key)

Postman
Method: POST
URL: http://localhost:5001/api/admin/events

Headers:
Content-Type: application/json
x-api-key: super-secret-key-change-me

Body (raw JSON):
```
{ "name": "CS Club Expo", "date": "2025-11-25", "tickets": 100 }
```

cURL
```
curl -X POST http://localhost:5001/api/admin/events \
  -H "Content-Type: application/json" \
  -H "x-api-key: super-secret-key-change-me" \
  -d '{"name":"CS Club Expo","date":"2025-11-25","tickets":100}'
```
7.2 List events (Client)
Method: GET
URL: http://localhost:6001/api/events
```
curl http://localhost:6001/api/events
```
7.3 Purchase a ticket (Client)
Method: POST
URL: http://localhost:6001/api/events/:id/purchase
Replace :id with a real ID returned by /api/events:
```
curl -X POST http://localhost:6001/api/events/1/purchase
```

Expected outcomes:

200 purchase successful (returns remaining)
404 event not found
409 sold out
500 server error (check logs)

## 7. Frontend Usage

Visit http://localhost:5173

Events load from /api/events

Click Buy Ticket → status message appears

Ticket count refreshes automatically

Screen readers announce updates via aria-live

Accessibility Highlights

Semantic structure (header, main, section, ul, time)

Skip link + visible focus outlines for keyboard users

aria-live announcements for ticket changes

## 8. Concurrency & Consistency

The client-service uses SQL transactions:
```
BEGIN IMMEDIATE;
SELECT tickets FROM events WHERE id = ?;
UPDATE events SET tickets = tickets - 1 WHERE id = ?;
COMMIT;
```

Two simultaneous purchases of the last ticket → one succeeds, one receives 409 Sold out.

Guaranteed: no negative tickets, no double-sell.

Quick test:
Open two Postman tabs with POST /api/events/:id/purchase and hit Send quickly on both; you’ll see one success and one 409.

## 9. Postman CSV Runner (optional seeding)

Create events.csv anywhere on your machine:
```
name,date,tickets
Esports Expo,2025-11-10,100
Fall Concert,2025-12-01,250
Robotics Showcase,2026-01-21,120
```

Use Postman Runner:

Request: POST http://localhost:5001/api/admin/events

Headers: Content-Type: application/json, x-api-key: {{ADMIN_API_KEY}}

Body:
```
{ "name": "{{name}}", "date": "{{date}}", "tickets": {{tickets}} }
```
Run the collection using events.csv as data file.

## 10. Inspecting the Database (optional)
Use sqlite extensions in vscode or the following:
```
sqlite3 backend/shared-db/database.sqlite ".schema events"
sqlite3 backend/shared-db/database.sqlite "SELECT id,name,date,tickets FROM events;"
```

## 11. Common Issues & Fixes

401 Unauthorized (Admin POST)
Missing or wrong x-api-key. Ensure .env exists in admin-service and server was restarted.

500 Server error on create
Check console logs; ensure init.sql matches the columns you insert.

CORS errors
Make sure admin/client services are running, and ports match the README.

Vite cannot find index.html
Ensure frontend/index.html exists and your dev server is run from frontend/.

Database locked
Very rare; try stopping other services briefly or ensure you aren’t opening the .sqlite file in a GUI at the same time.

## 12. API Reference (quick)

Admin Service (5001):

POST /api/admin/events
Body: { name, date(YYYY-MM-DD), tickets(int >= 0) }
Headers: x-api-key

Client Service (6001):

GET /api/events → { events: [] }

POST /api/events/:id/purchase → { message, eventId, remaining }

## 13. Scripts (optional enhancements)

Add to backend/admin-service/package.json:
```
"scripts": {
  "start": "node server.js",
  "dev": "NODE_ENV=development node server.js"
}
```

Add to backend/client-service/package.json:
```
"scripts": {
  "start": "node server.js",
  "dev": "NODE_ENV=development node server.js"
}
```

Add to frontend/package.json:
```
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```
## 14. Code Quality

Separation of concerns: routes → controllers → models

Parameterized SQL

Clear, meaningful HTTP codes

In-code comments mapped to rubric tasks

Basic test scaffold (App.test.js)

## 15. Automated Testing

All tests run locally—no external APIs required.

**Admin (Jest)**
```
cd backend/admin-service
npm test
```
ESM-enabled Jest.
Cases: invalid create (400), valid create (201), duplicate (409).

**Client (Jest + temp SQLite)**
```
cd backend/client-service
npm test
```
Tests create a temp DB (outside shared-db/), set DB_PATH before importing routes, apply init.sql, and clean up.
Cases: list (200), sequential purchases (200/200/409), concurrent purchases (one 200, one 409).

**LLM (Jest, CommonJS, axios mocked)**
```
cd backend/llm-service
npm test
```
server.js exports the Express app (doesn’t auto-listen during tests).
axios mocked to simulate /api/events lookups and downstream purchase.
Cases: parse proposal, confirm success, confirm unknown → 404.

**Frontend (Vitest + RTL + JSDOM)**
```
cd frontend
npm run test        # watch
npm run test:run    # single run (CI)
```
global.fetch mocked by URL (parse, confirm, events) to avoid flakiness.
Voice helpers mocked (no audio/Web Speech API).
Cases:
  EventList.test.jsx — buys a ticket, checks live region + refresh.
  ChatAssistant.test.jsx — propose → confirm; assertions tolerate aria-live duplication.

## 16. Manual Testing

**Text NL flow**
  “show events” → list appears in chat.
  “book 2 for Jazz Night” → proposal shown.
  Click Confirm → success message; EventList reflects decreased tickets.
**Voice flow**
  Click Talk (beep). Speak: “book one ticket for Jazz Night.”
  Click Stop (double-beep). Text is submitted → proposal → Confirm.
**Accessibility**
  Tab order, skip link, visible focus ring.
  aria-live announces purchases/errors.
**Concurrency (dev)**
  Seed event with 1 ticket.
  Fire two purchases in quick succession → observe one 200, one 409.

## 17. Credits

Built for CPSC 3720.
Team: Trenton McDonald, Michael Dawson, Jeffrey Moon

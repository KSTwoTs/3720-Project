# TigerTix Overview

TigerTix enables:
- Event creation (Admin)
- Event listing & ticket purchasing (Client)
- User registration, login, logout, and session handling (Auth)
- Natural Language Understanding for booking tickets (LLM → Confirm booking flow)
- React frontend with accessible UI and live updates
- SQLite-backed persistence with consistent schema across microservices
The project demonstrates a production-ready microservice architecture with authentication, routing, concurrency safety, LLM-powered workflows, and strong testing practices.

## Prerequisites

- Node.js ≥ 18  
- npm ≥ 9  
- Git (optional, for cloning)  
- VS Code (recommended)  
- Postman (optional, for testing APIs)  
- SQLite CLI (optional, for inspecting the DB)

## Demo Video
https://youtu.be/mntsyxXo_rI

## Project Structure
```text
├── backend/
│ ├── shared-db/
│ │ ├── database.sqlite       # created automatically if missing
│ │ └── init.sql              # DB schema
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
│ │ └── .env                  # ADMIN_API_KEY=..., PORT=5001
│ ├── client-service/
│ │ ├── controllers/
│ │ │ └── clientController.js
│ │ ├── models/
│ │ │ └── clientModel.js
│ │ ├── middleware/
│ │ │ └── authMiddleware.js
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
│ ├── user-authentication/
│ │ ├── controllers/
│ │ │ └── authController.js
│ │ ├── middleware/
│ │ │ └── authMiddleware.js
│ │ ├── models/
│ │ │ └── userModel.js
│ │ ├── routes/
│ │ │ └── authRoutes.js
│ │ ├── tests/
│ │ │ └── auth.test.mjs
│ │ ├── package-lock.json
│ │ ├── package.json
│ │ ├── server.mjs
│ │ ├── databse.js
│ │ ├── vitest.config.mjs
│ │ └── .env
├── frontend/
│ │ ├── public/ 
│ │ ├── src/
│ │ │ ├── components/
│ │ │ │ ├── auth/
│ │ │ │ │ ├── Login.jsx
│ │ │ │ │ ├── Login.test.jsx
│ │ │ │ │ ├── Register.jsx
│ │ │ │ │ └── Register.test.jsx
│ │ │ │ ├── tests/
│ │ │ │ │ ├── ChatAssistant.test.jsx
│ │ │ │ │ └── EventList.test.jsx
│ │ │ │ ├── ChatAssistant.jsx
│ │ │ │ └── EventList.jsx
│ │ │ ├── context/
│ │ │ │ ├── AuthContext.jsx
│ │ │ │ └── AuthContext.test.jsx
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

**Local-Host Ports:** Admin 5001 | Client 6001 | LLM 7001 | Frontend 5173

## Architecture Summary

```
                      ┌────────────────────────────────┐
                      │        Frontend (Vercel)       │
                      │ React / AuthContext / Chat UI  │
                      └──────────────┬─────────────────┘
                                     │
                                     │ HTTPS requests
                                     ▼
     ┌─────────────────────────────────────────────────────────────────────┐
     │                    Backend (Render)                                 │
     │                                                                     │
     │   ┌────────────────────────┐   issues JWTs   ┌──────────────────────┐
     │   │ User-Auth Service      │◄────────────────►   Frontend Login     │
     │   │ register/login/logout  │                 └──────────────────────┘
     │   └───────────┬────────────┘                                        
     │               │ validates JWT                                       
     │               ▼                                                     
     │   ┌────────────────────────┐    protected routes                    
     │   │ Client-Service         │◄───────────────────────────────────────┐
     │   │ events + purchase      │                                        │
     │   └───────────┬────────────┘                                        │
     │               │                                                     │
     │               ▼                                                     │
     │   ┌────────────────────────┐                                        │
     │   │ LLM-Service            │──────── confirms bookings ─────────────┘
     │   │ parse intent / confirm │  (forwards Authorization header)       
     │   └────────────────────────┘                                        
     │                                                                     
     └─────────────────────────────────────────────────────────────────────┘
```
**Data Flow Summary**
- User logs in → receives JWT cookie + token in memory
- Frontend sends Authorization: Bearer <token> for protected actions
- Client-service validates token before allowing purchases
- LLM-service uses token to perform authenticated downstream operations
- Events update immediately on purchase

## TigerTix Microservice Route Reference (Production Deployments) (Render + Vercel)
```
Admin-Service (Render)
  POST https://tigertix-admin-service.onrender.com/api/admin/events

Client-Service (Render)
  GET  https://tigertix-client-service.onrender.com/api/events
  POST https://tigertix-client-service.onrender.com/api/events/:id/purchase

Auth-Service (Render)
  POST https://tigertix-user-auth-service.onrender.com/api/auth/register
  POST https://tigertix-user-auth-service.onrender.com/api/auth/login
  GET  https://tigertix-user-auth-service.onrender.com/api/auth/me
  POST https://tigertix-user-auth-service.onrender.com/api/auth/logout

LLM-Service (Render)
  POST https://tigertix-llm-service.onrender.com/api/llm/parse
  POST https://tigertix-llm-service.onrender.com/api/llm/confirm

Frontend (Vercel)
  https://3720-project.vercel.app
```

## Tech Stack

**Frontend**
- React (Vite)
- React Router
- AuthContext (custom)
- ARIA accessibility & live regions
- Jest / Vitest / React Testing Library
**Backend (Microservices via Express)**
- Admin Service
- Client Service
- User-Authentication Service
- LLM Service (axios + rule-based NLU)
**Database**
- SQLite (local + Render deployment)
- Schema: init.sql shared across services
**Other**
- bcryptjs for password hashing
- jsonwebtoken for issuing/validating JWTs
- axios for internal service-to-service communication
- Render deployment for all backend microservices
- Vercel deployment for frontend
- GitHub Actions CI/CD
- LLM provider (e.g., OpenAI gpt-4o-mini) via API key

## Getting Started (Local-Host through VS Code)

Clone the repo, then open the root folder in **VS Code**.

Open **four terminals** (Terminal → New Terminal).

If running on Windows PowerShell, temporarily allow scripts:
```bash
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Environment Variable Setup
Create .env files for each microservice. These files go in the root directory of the microservice it pertains to. 

Admin-Service
```
ADMIN_API_KEY=your_secret_key
PORT=5001
```

Auth-Service
```
PORT=8001
JWT_SECRET=your_secret_key
FRONTEND_ORIGIN=http://localhost:5173
AUTH_DB_PATH=../shared-db/database.sqlite
NODE_ENV=development
```

Client-Service
```
PORT=6001
FRONTEND_ORIGIN=http://localhost:5173
JWT_SECRET=your_secret_key
```

LLM-Service
```
PORT=7001
CLIENT_URL=http://localhost:6001
LLM_PROVIDER-openai
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_KEY=your_generated_key_from_openai_api_key_site
```

## Install & Run — Back-end services

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

You should see:
```
llm service running on port 7001
```

Terminal 4 **user-authentication**
```
cd backend/user-authentication
npm install
npm start
```

You should see:
```
user-authentication service listening on port 8001
```

## Install & Run — Frontend (5173)

Terminal 5
```
cd frontend
npm install
npm run dev
```

Open the printed URL (usually http://localhost:5173).
You’ll see a list of events (empty at first) and a Buy Ticket button per event.

## Using the APIs (Postman / cURL)
Create an event (Admin, requires API key)

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
List events (Client)
Method: GET
URL: http://localhost:6001/api/events
```
curl http://localhost:6001/api/events
```
Purchase a ticket (Client)
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

## Frontend Usage

**Visit http://localhost:5173 or 3720-project.vercel.app**
- Events load from /api/events
- Click Buy Ticket → status message appears
- Ticket count refreshes automatically
- Screen readers announce updates via aria-live

**Accessibility Highlights**
- Semantic structure (header, main, section, ul, time)
- Skip link + visible focus outlines for keyboard users
- aria-live announcements for ticket changes

## Concurrency & Consistency

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

## Postman CSV Runner (optional seeding)

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

## Inspecting the Database (optional)
Use sqlite extensions in vscode or the following:
```
sqlite3 backend/shared-db/database.sqlite ".schema events"
sqlite3 backend/shared-db/database.sqlite "SELECT id,name,date,tickets FROM events;"
```

## Common Issues & Fixes

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

## API Reference (quick)

Admin Service (5001):

POST /api/admin/events
Body: { name, date(YYYY-MM-DD), tickets(int >= 0) }
Headers: x-api-key

Client Service (6001):

GET /api/events → { events: [] }

POST /api/events/:id/purchase → { message, eventId, remaining }

## Scripts (optional enhancements)

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
## Code Quality

Separation of concerns: routes → controllers → models

Parameterized SQL

Clear, meaningful HTTP codes

In-code comments mapped to rubric tasks

Basic test scaffold (App.test.js)

## Automated Testing (Regression Tests)

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

**User-Authentication (Vitest)**
```
cd backend/user-authentication
npm test
```
Cases: register, duplicate email, login success/failure, /me with/without token, logout, token expiration.

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

## CI/CD (GitHub Actions, Render, Vercel)
- GitHub Actions runs all backend + frontend test suites on each push.
- Deploys only occur if all tests pass (regression safety).
- Backend microservices are deployed to Render; frontend is deployed to Vercel.
- Environment variables (DB paths, JWT secret, API URLs) are configured in each platform’s dashboard.

## Manual Testing

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

## License
This project is licensed under the MIT License.
See: https://choosealicense.com/licenses/mit/

## Credits

Built for CPSC 3720.
Team: Trenton McDonald, Michael Dawson, Jeffrey Moon

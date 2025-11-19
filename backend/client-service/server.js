// Task 2 — Client Microservice host
//   • Exposes public API the React app uses (GET events, POST purchase)
// Task 6 — Code Quality (simple, modular, minimal middleware)

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import clientRoutes from './routes/clientRoutes.js';

const app = express();

// Allow the frontend to call this API with credentials (cookies)
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true, // IMPORTANT: allow cookies with CORS
  })
);

// Parse JSON request bodies
app.use(express.json());

// Parse cookies (needed for JWT auth)
app.use(cookieParser());

// Mount public endpoints under /api
app.use('/api', clientRoutes);

// By spec, client service runs on 6001 (frontend points here)
const PORT = process.env.PORT || 6001;
app.listen(PORT, () => console.log(`Client service running on port ${PORT}`));

export default app;
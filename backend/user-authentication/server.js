// backend/user-authentication/server.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

// If your frontend runs on a different origin, update this:
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true // allow cookies
  })
);

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'user-authentication service up' });
});

// Mount auth routes under /api/auth
app.use('/api/auth', authRoutes);

// Don’t call listen() when running under Vitest (tests)
if (!process.env.VITEST) {
  app.listen(PORT, () => {
    console.log(`User-authentication service listening on port ${PORT}`);
  });
}

export default app;
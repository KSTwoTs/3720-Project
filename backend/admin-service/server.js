// === Task 1.1 & 1.3 ===
// Admin microservice entrypoint (POST /api/admin/events)
// Handles input validation, rate-limiting, and routing.
// Task 6: Clean structure and single responsibility per module.

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

// Debug log (Task 1.3: ensure .env is loaded and visible in dev)
console.log("Loaded ADMIN_API_KEY:", process.env.ADMIN_API_KEY);

import adminRoutes from './routes/adminRoutes.js';
import './setup.js'; // Task 1.2: ensures DB schema exists

const app = express();

// Restrict origins to your frontend (Task 6: security best practice)
app.use(cors({ origin: ['http://localhost:5173'], methods: ['GET', 'POST'] }));
app.use(express.json());

// Task 1.3: Implement rate limiting for robustness (prevents abuse)
const keyExtractor = (req) => req.header('x-api-key') || req.ip;
const createLimiter = rateLimit({
  windowMs: 60_000, // 1 minute window
  max: 30,          // max 30 POSTs per minute per key/IP
  keyGenerator: keyExtractor
});
app.use('/api/admin', createLimiter); // Apply limiter to admin routes

// Task 1.1: Mount route for POST /api/admin/events
app.use('/api', adminRoutes);

// Launch service (Task 6: self-documenting console log)
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Admin service running on port ${PORT}`));

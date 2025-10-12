import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();
console.log("Loaded ADMIN_API_KEY:", process.env.ADMIN_API_KEY);

import adminRoutes from './routes/adminRoutes.js';
import './setup.js';

const app = express();
app.use(cors({ origin: ['http://localhost:5173'], methods: ['GET','POST'] }));
app.use(express.json());

// Basic rate-limit for create operations (adjust as needed)
const keyExtractor = (req) => req.header('x-api-key') || req.ip;
const createLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,                      // 30 create attempts / minute / key
  keyGenerator: keyExtractor
});app.use('/api/admin', createLimiter);

app.use('/api', adminRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Admin service running on port ${PORT}`));

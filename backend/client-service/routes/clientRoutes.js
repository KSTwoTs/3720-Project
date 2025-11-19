// Task 2.1 — GET API to fetch events (returns full list in JSON)
// Task 2.2 — POST API to purchase tickets (decrement count via model)
// Task 6 — Code Quality (clear, RESTful paths)

import { Router } from 'express';
import { listEvents, buyTicket } from '../controllers/clientController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/events
router.get('/events', listEvents); // Task 2.1

// POST /api/events/:id/purchase
router.post('/events/:id/purchase', requireAuth, buyTicket); // Task 2.2

export default router;

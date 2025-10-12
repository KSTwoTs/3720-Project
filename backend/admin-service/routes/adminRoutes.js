// === Task 1.1 ===
// Defines the event creation route and applies API-key authentication
// Task 1.3: Implements authorization before DB write
// Task 6: Clean separation of routes, middleware, controllers

import { Router } from 'express';
import apiKeyAuth from '../middleware/apiKeyAuth.js';
import { postEvent } from '../controllers/adminController.js';

const router = Router();

// POST /api/admin/events → Create new event
// Requires valid x-api-key header (handled by apiKeyAuth)
router.post('/admin/events', apiKeyAuth, postEvent);

export default router;

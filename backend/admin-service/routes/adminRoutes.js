import { Router } from 'express';
import apiKeyAuth from '../middleware/apiKeyAuth.js';
import { postEvent } from '../controllers/adminController.js';

const router = Router();

// All admin create/update routes require API key
router.post('/admin/events', apiKeyAuth, postEvent);

export default router;

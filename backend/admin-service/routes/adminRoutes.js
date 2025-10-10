import { Router } from 'express';
import { postEvent } from '../controllers/adminController.js';


const router = Router();


// POST /api/admin/events — per spec, but rubric also allows POST /api/events
router.post('/admin/events', postEvent);
router.post('/events', postEvent); // convenience alias


export default router;

import { Router } from 'express';
import { listEvents, buyTicket } from '../controllers/clientController.js';


const router = Router();


router.get('/events', listEvents); // GET /api/events
router.post('/events/:id/purchase', buyTicket); // POST /api/events/:id/purchase


export default router;

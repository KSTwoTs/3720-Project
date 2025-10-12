// Task 2.1 — List events: return JSON array, handle errors
// Task 2.2 — Purchase ticket: proper status codes + body
// Task 2.3 — Pairs with transactional model for atomicity
// Task 6   — Code quality: clear status mapping, concise error paths

import { getAllEvents, purchaseTicket } from '../models/clientModel.js';

// GET /api/events  (Task 2.1)
export async function listEvents(req, res) {
  try {
    const events = await getAllEvents();
    return res.json({ events }); // 200
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch events' }); // robust fallback
  }
}

// POST /api/events/:id/purchase  (Tasks 2.2, 2.3)
export async function buyTicket(req, res) {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ error: 'Invalid event id' }); // Task 2.2 validation
    }

    const result = await purchaseTicket(eventId);
    return res.json({ message: 'Purchase successful', ...result }); // 200 + new remaining
  } catch (err) {
    if (err.message === 'Event not found') {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (err.message === 'Sold out') {
      return res.status(409).json({ error: 'Event is sold out' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Failed to purchase ticket' });
  }
}

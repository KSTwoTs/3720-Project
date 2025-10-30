// controllers/clientController.js
// Step 2: Transaction-safe purchase with quantity support and clear status codes.

import { getAllEvents, purchaseTicket } from '../models/clientModel.js';

// GET /api/events  — return full list for the UI
export async function listEvents(req, res) {
  try {
    const events = await getAllEvents();
    // Keep shape { events } to match current frontend usage
    return res.json({ events });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
}

// POST /api/events/:id/purchase  — atomic decrement, requires qty/tickets (defaults to 1)
export async function buyTicket(req, res) {
  try {
    const eventId = Number(req.params.id);
    const qty = Number(
      req.body?.tickets ?? req.body?.qty ?? 1 // default to 1 if not provided
    );

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ error: 'Invalid event id' });
    }
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ error: 'Invalid ticket quantity' });
    }

    const result = await purchaseTicket(eventId, qty);
    // { eventId, remaining }
    return res.json({
      status: 'booked',
      eventId: result.eventId,
      tickets: qty,
      remaining: result.remaining
    });
  } catch (err) {
    const msg = err?.message || '';
    if (msg === 'Event not found') {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (msg === 'Not enough tickets' || msg === 'Sold out') {
      // 409 = conflict, but 400 is acceptable too; using 409 for clarity
      return res.status(409).json({ error: msg });
    }
    console.error(err);
    return res.status(500).json({ error: 'Failed to purchase ticket' });
  }
}

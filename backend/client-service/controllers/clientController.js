import { getAllEvents, purchaseTicket } from '../models/clientModel.js';


export async function listEvents(req, res) {
try {
const events = await getAllEvents();
return res.json({ events });
} catch (err) {
console.error(err);
return res.status(500).json({ error: 'Failed to fetch events' });
}
}


export async function buyTicket(req, res) {
try {
const { id } = req.params;
const eventId = Number(id);
if (!Number.isInteger(eventId) || eventId <= 0) {
return res.status(400).json({ error: 'Invalid event id' });
}


const result = await purchaseTicket(eventId);
return res.json({ message: 'Purchase successful', ...result });
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

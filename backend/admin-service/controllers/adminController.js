import { createEvent } from '../models/adminModel.js';


export async function postEvent(req, res) {
try {
const { name, date, tickets } = req.body || {};


if (!name || !date || Number.isNaN(Number(tickets))) {
return res.status(400).json({ error: 'Invalid payload: name, date, tickets required.' });
}


const t = Number(tickets);
if (!Number.isInteger(t) || t < 0) {
return res.status(400).json({ error: 'tickets must be a non-negative integer' });
}


const event = await createEvent({ name, date, tickets: t });
return res.status(201).json({ message: 'Event created', event });
} catch (err) {
console.error(err);
return res.status(500).json({ error: 'Server error creating event' });
}
}

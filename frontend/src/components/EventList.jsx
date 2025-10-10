import React, { useEffect, useState } from 'react';


const API_BASE = 'http://localhost:6001/api';


export default function EventList() {
const [events, setEvents] = useState([]);
const [loading, setLoading] = useState(true);
const [message, setMessage] = useState('');


async function fetchEvents() {
try {
setLoading(true);
const res = await fetch(`${API_BASE}/events`);
const data = await res.json();
setEvents(data.events || []);
} catch (e) {
setMessage('Failed to load events');
} finally {
setLoading(false);
}
}


useEffect(() => {
fetchEvents();
}, []);


async function handleBuy(id, name) {
setMessage('');
try {
const res = await fetch(`${API_BASE}/events/${id}/purchase`, { method: 'POST' });
const body = await res.json();
if (!res.ok) throw new Error(body.error || 'Purchase failed');


setMessage(`Purchased 1 ticket for ${name}. Remaining: ${body.remaining}`);
document.getElementById('status-region').textContent = `Purchased 1 ticket for ${name}. Remaining: ${body.remaining}`;
await fetchEvents();
} catch (e) {
setMessage(e.message);
document.getElementById('status-region').textContent = e.message;
}
}


if (loading) return <p>Loading events…</p>;


return (
<section aria-labelledby="events-heading">
<h2 id="events-heading">Available Events</h2>
{message && <div role="status" aria-live="polite" style={{marginBottom:'1rem'}}>{message}</div>}
<ul role="list" aria-describedby="events-heading">
{events.map(ev => (
<li key={ev.id} style={{marginBottom:'0.75rem'}}>
<article aria-labelledby={`ev-${ev.id}-title`}>
<h3 id={`ev-${ev.id}-title`}>{ev.name}</h3>
<p><strong>Date:</strong> {ev.date}</p>
<p><strong>Tickets:</strong> {ev.tickets}</p>
<button
onClick={() => handleBuy(ev.id, ev.name)}
aria-label={`Buy one ticket for ${ev.name}`}
>
Buy Ticket
</button>
</article>
</li>
))}
</ul>
</section>
);
}

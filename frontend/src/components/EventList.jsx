import React, { useEffect, useRef, useState } from 'react';

const API_BASE = 'http://localhost:6001/api';

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const statusRef = useRef(null);

  async function fetchEvents() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/events`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      announce('Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    statusRef.current = document.getElementById('status-region');
    fetchEvents();
  }, []);

  function announce(text) {
    setMessage(text);
    if (statusRef.current) {
      // Update the live region text so screen readers announce it
      statusRef.current.textContent = text;
    }
  }

  async function handleBuy(id, name) {
    try {
      const res = await fetch(`${API_BASE}/events/${id}/purchase`, { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Purchase failed');

      announce(`Purchased 1 ticket for ${name}. Remaining: ${body.remaining}`);
      await fetchEvents();
    } catch (e) {
      announce(e.message);
    }
  }

  if (loading) return <p role="status">Loading events…</p>;

  return (
    <section aria-labelledby="events-heading">
      <h2 id="events-heading">Available Events</h2>

      {/* Visible message for sighted users; aria-live handled by #status-region */}
      {message && (
        <div role="status" aria-live="polite" style={{ marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      <ul role="list" aria-describedby="events-heading">
        {events.map(ev => {
          const soldOut = Number(ev.tickets) <= 0;
          return (
            <li key={ev.id} style={{ marginBottom: '0.75rem' }}>
              <article
                aria-labelledby={`ev-${ev.id}-title`}
                role="article"
              >
                <h3 id={`ev-${ev.id}-title`}>{ev.name}</h3>
                <p><strong>Date:</strong> <time dateTime={ev.date}>{ev.date}</time></p>
                <p>
                  <strong>Tickets:</strong>{' '}
                  <span aria-live="polite" aria-atomic="true">{ev.tickets}</span>
                </p>

                <button
                  type="button"
                  onClick={() => handleBuy(ev.id, ev.name)}
                  aria-label={soldOut
                    ? `${ev.name} is sold out`
                    : `Buy one ticket for ${ev.name}`}
                  disabled={soldOut}
                  aria-disabled={soldOut}
                >
                  {soldOut ? 'Sold Out' : 'Buy Ticket'}
                </button>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

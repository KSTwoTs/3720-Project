// === Tasks 3.2, 4.1, 4.2, and 6 ===
// React component that lists events and allows users to purchase tickets.
// Task 3.2 – Implements purchase logic & updates UI
// Task 4.1 – Semantic HTML + ARIA for screen readers
// Task 4.2 – Keyboard accessibility & focus feedback
// Task 6 – Code quality (clean hooks, modular functions, comments)

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

// API base URL for the client-service microservice
// In dev: falls back to localhost:6001
const API_BASE =
  import.meta.env.VITE_CLIENT_API_URL || 'http://localhost:6001';

export default function EventList() {
  // === Task 6: Clear state management ===
  const [events, setEvents] = useState([]);     // stores fetched events
  const [loading, setLoading] = useState(true); // loading flag for UX feedback
  const [message, setMessage] = useState('');   // visible + screen-reader messages
  const statusRef = useRef(null);               // ref to the aria-live region
  const { logout, token } = useAuth();

  // === Task 3.1/3.2 ===
  // Fetch all events from client-service and update state.
  async function fetchEvents() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/events`);
      const data = await res.json();
      setEvents(data.events || []); // handles no-data case gracefully
    } catch (err) {
      console.error('Failed to load events', err);
      // This will be a no-op for DOM access in tests because announce is guarded
      announce('Failed to load events'); // accessible error message
    } finally {
      setLoading(false);
    }
  }

  // === Task 6: Lifecycle logic kept concise ===
  useEffect(() => {
    // store live-region reference for a11y announcements
    statusRef.current = document.getElementById('status-region');
    fetchEvents();
  }, []);

  // === Task 4.1 – Accessibility helper ===
  // Announces text changes to screen readers via aria-live region.
  function announce(text) {
    // Always update React state (safe in tests, doesn’t require DOM)
    setMessage(text);

    // In Node / non-DOM envs (Vitest default), bail out before touching the DOM
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Lazily resolve the live region if we don't have it yet
    if (!statusRef.current) {
      statusRef.current = document.getElementById('status-region');
    }

    if (statusRef.current) {
      statusRef.current.textContent = text;
    }
  }

  // === Task 3.2: Purchase functionality ===
  async function handleBuy(id, name) {
    try {

      const headers = token
        ? { Authorization: `Bearer ${token}`}
        : {};
      
      const res = await fetch(`${API_BASE}/api/events/${id}/purchase`, {
        method: 'POST',
        credentials: 'include', // send JWT cookie to protected route
        headers,
      });
      const body = await res.json();

      // Handle token expiration / auth errors from backend
      if (res.status === 401) {
        if (body && body.code === 'TOKEN_EXPIRED') {
          announce('Session expired. Please log in again.');
        } else {
          announce(body.error || 'Authentication required. Please log in.');
        }
        logout(); // clear local user state -> App will show login screen
        return;
      }

      if (!res.ok) throw new Error(body.error || 'Purchase failed');

      // Update both visible and screen-reader messages (Task 4.1)
      announce(`Purchased 1 ticket for ${name}. Remaining: ${body.remaining}`);

      // Refresh event list to reflect new ticket counts
      await fetchEvents();
    } catch (e) {
      announce(e.message); // surfaces errors to all users (Task 1.3 / 4.1)
    }
  }

  // === Task 3.1 – Loading feedback for users and screen readers ===
  if (loading) return <p role="status">Loading events…</p>;

  // === Render list of events ===
  return (
    // Task 4.1: Semantic <section> with heading relationships
    <section aria-labelledby="events-heading">
      <h2 id="events-heading">Available Events</h2>

      {/* Task 4.1: Visible message for sighted users (aria-live handled separately) */}
      {message && (
        <div role="status" aria-live="polite" style={{ marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      {/* Task 4.1 – Proper list semantics for accessibility */}
      <ul role="list" aria-describedby="events-heading">
        {events.map(ev => {
          const soldOut = Number(ev.tickets) <= 0;
          return (
            <li key={ev.id} style={{ marginBottom: '0.75rem' }}>
              <article
                aria-labelledby={`ev-${ev.id}-title`}
                role="article"
              >
                {/* Task 4.1: Hierarchical heading for each event */}
                <h3 id={`ev-${ev.id}-title`}>{ev.name}</h3>

                {/* Task 4.1: Use <time> for date semantics */}
                <p>
                  <strong>Date:</strong>{' '}
                  <time dateTime={ev.date}>{ev.date}</time>
                </p>

                {/* Task 4.1: Announce dynamic ticket counts politely */}
                <p>
                  <strong>Tickets:</strong>{' '}
                  <span aria-live="polite" aria-atomic="true">
                    {ev.tickets}
                  </span>
                </p>

                {/* Task 3.2 – Purchase Button */}
                {/* Task 4.2 – Keyboard accessible, clear labels, and disabled state */}
                <button
                  type="button"
                  onClick={() => handleBuy(ev.id, ev.name)}
                  aria-label={
                    soldOut
                      ? `${ev.name} is sold out`
                      : `Buy one ticket for ${ev.name}`
                  }
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

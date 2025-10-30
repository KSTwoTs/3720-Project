import React from 'react';
import EventList from './components/EventList.jsx';
import ChatAssistant from './components/ChatAssistant';

export default function App() {
  return (
    <>
      {/* === Task 4.2 ===
          Skip link allows keyboard users to jump straight to main content */}
      <a className="skip-link" href="#main-content">Skip to main content</a>

      <header role="banner">
        <h1 id="page-title">TigerTix Events</h1>
      </header>

      {/* === Task 4.1 ===
          main landmark with tabIndex for keyboard focus restoration */}
      <main id="main-content" role="main" tabIndex={-1}>
        {/* === Task 4.1 ===
            aria-live region announces updates (purchases, errors) to screen readers */}
        <p
          aria-live="polite"
          aria-atomic="true"
          id="status-region"
          className="sr-only"
        />

        {/* Layout: Chat on the left, Events on the right (stacks on small screens) */}
        <div className="app-grid">
          {/* === Chat panel ===
              Contains the NL interface. It never books automatically; it only proposes,
              and requires explicit confirmation (Task 3 requirement). */}
          <section
            aria-labelledby="chat-heading"
            className="panel"
          >
            <h2 id="chat-heading">Chat Assistant</h2>
            <ChatAssistant />
          </section>

          {/* === Task 3.1 ===
              Core event list that fetches and displays available events */}
          <section
            aria-labelledby="events-heading"
            className="panel"
          >
            <h2 id="events-heading">Events</h2>
            <EventList />
          </section>
        </div>
      </main>
    </>
  );
}

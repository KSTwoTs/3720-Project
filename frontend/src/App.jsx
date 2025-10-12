import React from 'react';
import EventList from './components/EventList.jsx';

export default function App() {
  return (
    <>
      {/* Skip to content link (hidden until focused) */}
      <a className="skip-link" href="#main-content">Skip to main content</a>

      <header role="banner">
        <h1 id="page-title">TigerTix Events</h1>
      </header>

      <main id="main-content" role="main" tabIndex={-1}>
        {/* Live region for announcements */}
        <p
          aria-live="polite"
          aria-atomic="true"
          id="status-region"
          className="sr-only"
        />
        <EventList />
      </main>
    </>
  );
}

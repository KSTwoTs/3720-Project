// === Tasks 3.1, 4.1, 4.2, 6 ===
// Main layout of the TigerTix frontend.
//
// Task 3.1: Hosts <EventList /> which loads data via client-service API.
// Task 4.1: Semantic HTML (header, main, skip-link, aria-live).
// Task 4.2: Keyboard focus management and skip link for accessibility.
// Task 6: Clear separation of layout and logic.

import React from 'react';
import EventList from './components/EventList.jsx';

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
        {/* === Task 3.1 ===
            Core event list that fetches and displays available events */}
        <EventList />
      </main>
    </>
  );
}

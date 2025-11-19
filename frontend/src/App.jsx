import React, { useState } from 'react';
import EventList from './components/EventList.jsx';
import ChatAssistant from './components/ChatAssistant';
import { useAuth } from './context/AuthContext.jsx';
import Login from './components/auth/Login.jsx';
import Register from './components/auth/Register.jsx';

const AUTH_BASE =
  import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8001/api/auth';

export default function App() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  async function handleLogout() {
    try {
      await fetch(`${AUTH_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      // ignore network errors on logout; still clear local state
    }
    logout();
  }

  return (
    <>
      {/* === Task 4.2 ===
          Skip link allows keyboard users to jump straight to main content */}
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header role="banner">
        <h1 id="page-title">TigerTix Events</h1>

        {/* Sprint 3 – show current user + logout */}
        <div aria-label="User session" style={{ marginTop: '0.5rem' }}>
          {user ? (
            <>
              <span>Logged in as {user.email}</span>{' '}
              <button type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <span>Not logged in</span>
          )}
        </div>
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

        {/* If not logged in, show auth UI instead of events/chat */}
        {!user ? (
          <section aria-label="Authentication">
            <div style={{ marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                aria-pressed={showLogin}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                aria-pressed={!showLogin}
                style={{ marginLeft: '0.5rem' }}
              >
                Register
              </button>
            </div>

            {showLogin ? (
              <Login onSuccess={() => setShowLogin(true)} />
            ) : (
              <Register onSuccess={() => setShowLogin(true)} />
            )}
          </section>
        ) : (
          // Layout: Chat on the left, Events on the right (stacks on small screens)
          <div className="app-grid">
            {/* === Chat panel === */}
            <section aria-labelledby="chat-heading" className="panel">
              <h2 id="chat-heading">Chat Assistant</h2>
              <ChatAssistant />
            </section>

            {/* === Task 3.1 ===
                Core event list that fetches and displays available events */}
            <section aria-labelledby="events-heading" className="panel">
              <h2 id="events-heading">Events</h2>
              <EventList />
            </section>
          </div>
        )}
      </main>
    </>
  );
}

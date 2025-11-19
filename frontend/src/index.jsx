// === Tasks 3.1 & 6 ===
// Entry point for the React frontend.
// Task 3.1: Mounts App component that fetches events and displays them.
// Task 6: Clean, minimal structure (imports separated, consistent naming).

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import { AuthProvider } from './context/AuthContext.jsx';

// StrictMode helps catch potential issues early (Task 6 quality practice)
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

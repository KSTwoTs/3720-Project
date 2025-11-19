// === Task 6 (Code Quality: Testing & Structure) ===
// Basic test scaffold using React Testing Library.
// Confirms App component renders successfully.

import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthContext.jsx';

test('renders main heading', () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  
  const heading = screen.getByRole('heading', { name: /TigerTix Events/i });
  expect(heading).toBeInTheDocument();
});

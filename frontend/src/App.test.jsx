// === Task 6 (Code Quality: Testing & Structure) ===
// Basic test scaffold using React Testing Library.
// Confirms App component renders successfully.

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders main heading', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /TigerTix Events/i });
  expect(heading).toBeInTheDocument();
});

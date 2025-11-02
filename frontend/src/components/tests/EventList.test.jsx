import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventList from '../EventList.jsx';

beforeEach(() => {
  global.fetch = vi.fn()
    // initial load
    .mockResolvedValueOnce({ ok: true, json: async () => ({ events: [{ id:1, name:'Jazz Night', date:'2025-11-15', tickets:2 }] }) })
    // purchase response
    .mockResolvedValueOnce({ ok: true, json: async () => ({ remaining: 1 }) })
    // reload after purchase
    .mockResolvedValueOnce({ ok: true, json: async () => ({ events: [{ id:1, name:'Jazz Night', date:'2025-11-15', tickets:1 }] }) });
});

test('renders events and buys a ticket', async () => {
  render(<EventList />);
  expect(await screen.findByRole('heading', { name: /Available Events/i })).toBeInTheDocument();
  const buyBtn = await screen.findByRole('button', { name: /Buy one ticket for Jazz Night/i });
  fireEvent.click(buyBtn);
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/Purchased 1 ticket/));
});

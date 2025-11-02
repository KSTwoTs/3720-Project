import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatAssistant from '../ChatAssistant';

beforeEach(() => {
  global.fetch = vi.fn()
    // parse -> propose
    .mockResolvedValueOnce({ ok:true, json: async () => ({ intent:'propose_booking', eventName:'Jazz Night', tickets:2, requiresConfirmation:true }) })
    // confirm -> booked
    .mockResolvedValueOnce({ ok:true, json: async () => ({ eventId:1, tickets:2 }) })
    // refresh events
    .mockResolvedValueOnce({ ok:true, json: async () => ({ events:[{ id:1, name:'Jazz Night', date:'2025-11-15', tickets:3 }] }) });
});

test('proposes then confirms booking', async () => {
  render(<ChatAssistant />);
  const input = screen.getByLabelText(/Chat input/i);
  fireEvent.change(input, { target: { value: 'book 2 for Jazz Night' } });
  fireEvent.submit(input.closest('form'));

  await waitFor(() => expect(screen.getByText(/I can book 2 ticket/)).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: /Confirm booking/i }));

  await waitFor(() => expect(screen.getByText(/Booked 2 for event/i)).toBeInTheDocument());
});

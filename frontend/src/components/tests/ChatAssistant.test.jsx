// src/components/tests/ChatAssistant.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatAssistant from '../ChatAssistant';

// Silence voice features in tests
vi.mock('../../lib/voice', () => ({
  supportsSTT: () => false,
  supportsTTS: () => false,
  speak: () => {},
  stopSpeaking: () => {},
  createRecognizer: () => null,
  startBeep: async () => {},
  stopBeep: async () => {},
}));

beforeEach(() => {
  // URL-aware fetch mock so call order doesn't matter
  global.fetch = vi.fn(async (url, options = {}) => {
    const u = typeof url === 'string' ? url : url?.url || '';

    // 1) Parse → propose booking
    if (u.includes('/api/llm/parse')) {
      return {
        ok: true,
        json: async () => ({
          intent: 'propose_booking',
          eventName: 'Jazz Night',
          tickets: 2,
          requiresConfirmation: true,
        }),
      };
    }

    // 2) Confirm → booked
    if (u.includes('/api/llm/confirm')) {
      return {
        ok: true,
        json: async () => ({
          eventId: 1,
          tickets: 2,
          eventName: 'Jazz Night', // include name in case the component uses it
        }),
      };
    }

    // 3) Events list (used after confirm to refresh UI and sometimes during parsing)
    if (u.includes('/api/events')) {
      return {
        ok: true,
        json: async () => ({
          events: [{ id: 1, name: 'Jazz Night', date: '2025-11-15', tickets: 3 }],
        }),
      };
    }

    // Default: simulate a network miss
    return { ok: false, json: async () => ({}) };
  });
});

afterEach(() => {
  vi.resetAllMocks();
});

test('proposes then confirms booking', async () => {
  render(<ChatAssistant />);

  const input = screen.getByLabelText(/chat input/i);
  fireEvent.change(input, { target: { value: 'book 2 for Jazz Night' } });

  // Submit by clicking the Send button (no TS non-null operator)
  fireEvent.click(screen.getByRole('button', { name: /send/i }));

  // Proposal appears twice (visible + aria-live). Allow multiple matches.
  const proposals = await screen.findAllByText(/I can book 2 ticket/i);
  expect(proposals.length).toBeGreaterThan(0);

  // Confirm booking
  fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }));

  // Success message – be flexible about wording/format
  // Match any text containing "Booked", "2", and "event" in order.
  const success = await screen.findByText((t) =>
    /booked/i.test(t) && /2/.test(t) && /event/i.test(t)
  );
  expect(success).toBeInTheDocument();
});

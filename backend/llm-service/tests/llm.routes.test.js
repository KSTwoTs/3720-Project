const request = require('supertest');
const express = require('express');
const cors = require('cors');

// ---- mock axios so we never hit real services/models ----
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));
const axios = require('axios');

// Use the deterministic mock provider for callLLM
process.env.LLM_PROVIDER = 'mock';
process.env.CLIENT_URL = 'http://localhost:6001'; // value won't be used since axios is mocked

// Require the app AFTER env + mocks are in place
const app = require('../server.js');

app.use(cors());
app.use(express.json());

describe('LLM endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('parse returns structured JSON without booking', async () => {
    // parse hits axios.get(`${CLIENT_URL}/api/events`) to fetch the catalog — return empty list
    axios.get.mockResolvedValueOnce({ data: [] });

    const res = await request(app)
      .post('/api/llm/parse')
      .send({ message: 'book 2 tickets for Jazz Night' });

    expect(res.status).toBe(200);
    expect(res.body.intent).toBe('propose_booking');
    expect(res.body.tickets).toBe(2);
    expect(res.body.requiresConfirmation).toBe(true);
  });

  test('confirm performs booking via client-service', async () => {
    // 1) name -> id resolution
    axios.get.mockResolvedValueOnce({ data: [{ id: 1, name: 'Jazz Night' }] });
    // 2) downstream purchase call
    axios.post.mockResolvedValueOnce({ data: { eventId: 1, tickets: 1, status: 'booked' } });

    const res = await request(app)
      .post('/api/llm/confirm')
      .send({ eventName: 'Jazz Night', tickets: 1 });

    expect(res.status).toBe(200);
    expect(res.body.eventId).toBe(1);
    expect(res.body.tickets).toBe(1);

    // sanity: ensure the expected downstream calls were made
    expect(axios.get).toHaveBeenCalledWith(`${process.env.CLIENT_URL}/api/events`);
    expect(axios.post).toHaveBeenCalledWith(`${process.env.CLIENT_URL}/api/events/1/purchase`, { tickets: 1 });
  });

  test('confirm returns 404 when event cannot be resolved', async () => {
    // catalog has no matching event
    axios.get.mockResolvedValueOnce({ data: [] });

    const res = await request(app)
      .post('/api/llm/confirm')
      .send({ eventName: 'Does Not Exist', tickets: 1 });

    expect(res.status).toBe(404);
  });
});

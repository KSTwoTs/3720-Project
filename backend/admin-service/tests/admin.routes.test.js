// ESM test (matches your "type":"module")
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import router from '../routes/adminRoutes.js';

// Provide the key expected by apiKeyAuth
process.env.ADMIN_API_KEY = 'test-key';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', router);

describe('Admin /api/admin/events', () => {
  test('400 on invalid payload', async () => {
    const res = await request(app)
      .post('/api/admin/events')
      .set('x-api-key', 'test-key')
      .send({ name: 'A', date: 'bad', tickets: -1 });
    expect(res.status).toBe(400); // zod should reject
  });

  test('201 on valid create', async () => {
    const res = await request(app)
      .post('/api/admin/events')
      .set('x-api-key', 'test-key')
      .send({ name: 'Jazz Night', date: '2025-11-15', tickets: 3 });
    expect([201, 409]).toContain(res.status);
    // 201 on first create, 409 if UNIQUE(name,date) hits on repeats
  });
});

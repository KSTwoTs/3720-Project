// backend/user-authentication/tests/auth.test.mjs
import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

let app;
let agent;

// use an in-memory DB + test secret
beforeAll(async () => {
  process.env.AUTH_DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-secret';
  process.env.FRONTEND_ORIGIN = 'http://localhost:5173';

  const mod = await import('../server.js');
  app = mod.default;
  agent = request.agent(app); // persists cookies between calls
});

// Clear users table before each test (in-memory DB should be fresh but let's be safe)
beforeEach(async () => {
  const { default: db } = await import('../database.js');
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM users', (err) => (err ? reject(err) : resolve()));
  });
});

describe('Auth API', () => {
  const email = 'test@example.com';
  const password = 'password123';

  it('registers a new user and sets cookie', async () => {
    const res = await agent
      .post('/api/auth/register')
      .send({ email, password })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(email);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('prevents duplicate registration with same email', async () => {
    await agent
      .post('/api/auth/register')
      .send({ email, password })
      .set('Content-Type', 'application/json');

    const res = await agent
      .post('/api/auth/register')
      .send({ email, password })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(409);
  });

  it('logs in existing user and returns JWT', async () => {
    await agent
      .post('/api/auth/register')
      .send({ email, password })
      .set('Content-Type', 'application/json');

    const res = await agent
      .post('/api/auth/login')
      .send({ email, password })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe(email);
    expect(res.body.token).toBeTypeOf('string');
  });

  it('rejects login with wrong password', async () => {
    await agent
      .post('/api/auth/register')
      .send({ email, password })
      .set('Content-Type', 'application/json');

    const res = await agent
      .post('/api/auth/login')
      .send({ email, password: 'wrong' })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(401);
  });

  it('requires auth for /me and returns current user when logged in', async () => {
    // unauthenticated first
    const resUnauthed = await request(app).get('/api/auth/me');
    expect(resUnauthed.statusCode).toBe(401);

    // register (auto-login) and then call /me with cookies
    await agent
      .post('/api/auth/register')
      .send({ email, password })
      .set('Content-Type', 'application/json');

    const res = await agent.get('/api/auth/me');

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it('clears cookie on logout', async () => {
    await agent
      .post('/api/auth/register')
      .send({ email, password })
      .set('Content-Type', 'application/json');

    const logoutRes = await agent.post('/api/auth/logout');

    expect(logoutRes.statusCode).toBe(200);

    // After logout, /me should be unauthorized
    const afterLogout = await agent.get('/api/auth/me');
    expect(afterLogout.statusCode).toBe(401);
  });
});

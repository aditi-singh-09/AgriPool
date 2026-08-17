import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

process.env.MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/agripool-test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-please-be-at-least-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-please-be-at-least-32-char';

let mongod: MongoMemoryServer;

describe('auth flow', () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod?.stop();
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
    await mongoose.connection.dropDatabase();
  });

  it('registers a new farmer account', async () => {
    const { createApp } = await import('../src/app.js');
    const app = createApp();

    const res = await request(app).post('/api/auth/register').send({
      email: 'farmer@example.com',
      password: 'correct-horse-battery-staple',
      displayName: 'Amina Farmer',
      role: 'farmer',
      walletAddress: 'G'.padEnd(56, 'A'),
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('farmer@example.com');
    expect(res.body.accessToken).toBeTruthy();
  });

  it('rejects duplicate registration', async () => {
    const { createApp } = await import('../src/app.js');
    const app = createApp();

    const payload = {
      email: 'dup@example.com',
      password: 'correct-horse-battery-staple',
      displayName: 'Dup User',
      role: 'buyer',
    };
    await request(app).post('/api/auth/register').send(payload);
    const res = await request(app).post('/api/auth/register').send(payload);

    expect(res.status).toBe(409);
  });

  it('rejects login with wrong password', async () => {
    const { createApp } = await import('../src/app.js');
    const app = createApp();

    await request(app).post('/api/auth/register').send({
      email: 'buyer@example.com',
      password: 'correct-horse-battery-staple',
      displayName: 'Bilal Buyer',
      role: 'buyer',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'buyer@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('rejects malformed registration payloads', async () => {
    const { createApp } = await import('../src/app.js');
    const app = createApp();

    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'short',
      displayName: '',
      role: 'astronaut',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});

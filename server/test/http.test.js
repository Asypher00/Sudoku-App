import { test } from '@jest/globals';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('health endpoint answers on /api/health', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { success: true, status: 'ok' });
});

test('CORS allows configured frontend and credentials', async () => {
  const response = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
  assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:5173');
  assert.equal(response.headers['access-control-allow-credentials'], 'true');
});

test('other origins are rejected', async () => {
  const response = await request(app).get('/api/health').set('Origin', 'http://evil.example');
  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'FORBIDDEN');
  assert.equal(response.headers['access-control-allow-origin'], undefined);
});

test('protected routes reject missing sessions', async () => {
  const response = await request(app).post('/api/games').send({ difficulty: 'easy' });
  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'UNAUTHORIZED');
});

test('registration validation rejects weak passwords before database access', async () => {
  const response = await request(app).post('/api/auth/register').send({ email: 'player@example.com', password: 'short' });
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('development frontend also supports the loopback IP address', async () => {
  const response = await request(app).get('/api/health').set('Origin', 'http://127.0.0.1:5173');
  assert.equal(response.status, 200);
  assert.equal(response.headers['access-control-allow-origin'], 'http://127.0.0.1:5173');
  assert.equal(response.headers['access-control-allow-credentials'], 'true');
});

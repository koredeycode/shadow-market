import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { app } from '../app';
import { closeDb } from '../db/client';

describe('Markets API', () => {
  afterAll(async () => {
    await closeDb();
  });

  describe('GET /api/markets', () => {
    it('should return all markets', async () => {
      const res = await request(app).get('/api/markets').expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('items');
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(app).get('/api/markets?status=OPEN').expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/markets/trending', () => {
    it('should return trending markets', async () => {
      const res = await request(app).get('/api/markets/trending').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/markets/:id', () => {
    it('should return 404 for non-existent market', async () => {
      const res = await request(app).get('/api/markets/nonexistent').expect(404);

      expect(res.body.success).toBe(false);
    });
  });
});

describe('Health Check', () => {
  it('should return ok', async () => {
    const res = await request(app).get('/health').expect(200);

    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});

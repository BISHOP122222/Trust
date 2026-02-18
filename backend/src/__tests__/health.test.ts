import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Health Check API', () => {
    it('should return UP and 200 status', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('UP');
    });

    it('should return 200 for branding information', async () => {
        const res = await request(app).get('/api/branding');
        expect(res.status).toBe(200);
    });
});

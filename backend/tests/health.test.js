import request from 'supertest';
import app from '../src/app.js';

test('health answers ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
});

test('an unknown route is a 404 in the common error shape', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ statusCode: 404, message: 'Route not found', success: false });
});

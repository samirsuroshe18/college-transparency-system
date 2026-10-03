import request from 'supertest';

// the limiter is off in the other test files; here it is on, with a small allowance
process.env.ACCOUNT_RATE_LIMIT = '3';

const { default: app } = await import('../src/app.js');

const api = '/api/v1';
const login = (ip) => request(app).post(`${api}/users/login`).set('X-Forwarded-For', ip).send({ email: 'nobody@test.dev', password: 'secret12' });

afterAll(() => {
    delete process.env.ACCOUNT_RATE_LIMIT;
});

test('sign-up, login and password reset share a limit per visitor', async () => {
    const ip = '203.0.113.7';
    const statuses = [];
    statuses.push((await login(ip)).status);
    statuses.push((await request(app).post(`${api}/users/forgot-password`).set('X-Forwarded-For', ip).send({ email: 'nobody@test.dev' })).status);
    statuses.push((await request(app).post(`${api}/users/register`).set('X-Forwarded-For', ip).send({})).status);

    const blocked = await login(ip);

    expect(statuses).toEqual([401, 200, 400]);
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ statusCode: 429, message: 'Too many attempts. Please try again in a few minutes.', success: false });
});

test('another visitor is not affected', async () => {
    expect((await login('203.0.113.8')).status).toBe(401);
});

test('the visitor is the first address when the request came through proxies', async () => {
    const viaProxies = '198.51.100.20, 10.0.0.1, 10.0.0.2';
    for (let i = 0; i < 3; i += 1) await login(viaProxies);

    expect((await login('198.51.100.20')).status).toBe(429);
    expect((await login('10.0.0.1')).status).toBe(401);
});

test('other routes are not limited', async () => {
    for (let i = 0; i < 5; i += 1) {
        expect((await request(app).get(`${api}/health`).set('X-Forwarded-For', '203.0.113.7')).status).toBe(200);
    }
});

import request from 'supertest';

// here the per-visitor limit is out of the way and the other limits are small
process.env.ACCOUNT_RATE_LIMIT = '100';
process.env.ACCOUNT_EMAIL_RATE_LIMIT = '3';
process.env.PROFILE_RATE_LIMIT = '3';

const { default: app } = await import('../src/app.js');

const api = '/api/v1';

afterAll(() => {
    delete process.env.ACCOUNT_RATE_LIMIT;
    delete process.env.ACCOUNT_EMAIL_RATE_LIMIT;
    delete process.env.PROFILE_RATE_LIMIT;
});

describe('review fixes', () => {
    const post = (path, body, ip) => request(app).post(`${api}${path}`).set('X-Forwarded-For', ip).send(body);

    test('one email address has its own limit, whatever address the requests claim to come from', async () => {
        const email = 'victim@test.dev';
        const statuses = [];
        for (let i = 0; i < 4; i += 1) {
            // a new claimed visitor each time, as a script calling the server directly would send
            statuses.push((await post('/users/forgot-password', { email }, `198.18.0.${i + 1}`)).status);
        }

        expect(statuses).toEqual([200, 200, 200, 429]);
        expect((await post('/users/forgot-password', { email: 'someone.else@test.dev' }, '198.18.0.99')).status).toBe(200);
    });

    test('the email limit ignores case and spaces', async () => {
        for (let i = 0; i < 3; i += 1) {
            await post('/users/login', { email: 'Mixed@Test.dev ', password: 'x' }, `198.18.1.${i + 1}`);
        }

        expect((await post('/users/login', { email: ' mixed@test.dev', password: 'x' }, '198.18.1.50')).status).toBe(429);
    });

    test('profile forms are limited per user', async () => {
        const { createUser, loginAgent } = await import('./helpers.js');
        const agent = await loginAgent(await createUser({ profileStatus: 'Approved' }));
        const statuses = [];
        for (let i = 0; i < 4; i += 1) {
            statuses.push((await agent.post(`${api}/profiles/student`).send({})).status);
        }

        // an empty form is refused with 400 each time, until the limit answers instead
        expect(statuses).toEqual([400, 400, 400, 429]);
    });
});

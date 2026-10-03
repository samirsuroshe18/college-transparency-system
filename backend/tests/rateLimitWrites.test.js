import request from 'supertest';

// limits are off in the other test files; here the write limit is on and small
process.env.ACCOUNT_RATE_LIMIT = '100';
process.env.ACCOUNT_EMAIL_RATE_LIMIT = '100';
process.env.WRITE_RATE_LIMIT = '3';

const { default: app } = await import('../src/app.js');
const { createUser, createAdmin, loginAgent } = await import('./helpers.js');

const api = '/api/v1';

afterAll(() => {
    delete process.env.ACCOUNT_RATE_LIMIT;
    delete process.env.ACCOUNT_EMAIL_RATE_LIMIT;
    delete process.env.WRITE_RATE_LIMIT;
});

test('writes in the modules are limited per user; reading is not', async () => {
    const agent = await loginAgent(await createAdmin());
    const statuses = [];
    for (let i = 0; i < 4; i += 1) {
        statuses.push((await agent.post(`${api}/facilities`).send({ name: `Hall ${i}`, description: 'd', location: 'l' })).status);
    }

    expect(statuses).toEqual([201, 201, 201, 429]);
    for (let i = 0; i < 5; i += 1) {
        expect((await agent.get(`${api}/facilities`)).status).toBe(200);
    }
});

test('the limit is shared across the modules and separate for each user', async () => {
    const one = await loginAgent(await createUser());
    const two = await loginAgent(await createUser());

    await one.post(`${api}/complaints`).send({ title: 'A', description: 'A complaint.' });
    await one.post(`${api}/applications`).send({ title: 'B', description: 'An application.', category: 'event' });
    await one.post(`${api}/complaints`).send({ title: 'C', description: 'Another complaint.' });
    const blocked = await one.post(`${api}/elections/507f1f77bcf86cd799439011/vote`).send({});

    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toBe('Too many attempts. Please try again in a few minutes.');
    expect((await two.post(`${api}/complaints`).send({ title: 'D', description: 'A complaint.' })).status).toBe(201);
});

test('two visitors on one shared account each have their own limit', async () => {
    const shared = await createUser({ isDemo: true });
    const first = await loginAgent(shared);
    const second = await loginAgent(shared);
    const post = (agent, ip, title) => agent.post(`${api}/complaints`).set('X-Forwarded-For', ip).send({ title, description: 'A complaint.' });

    for (let i = 0; i < 3; i += 1) await post(first, '203.0.113.10', `First ${i}`);

    expect((await post(first, '203.0.113.10', 'One too many')).status).toBe(429);
    expect((await post(second, '203.0.113.20', 'Someone else')).status).toBe(201);
});

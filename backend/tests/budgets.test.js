import { jest } from '@jest/globals';

// files are never really stored in tests
const storeFile = jest.fn(async (file) => (file ? 'https://files.example/bill.pdf' : null));
jest.unstable_mockModule('../src/utils/uploads.js', () => ({ storeFile, uploadsEnabled: () => true }));

const request = (await import('supertest')).default;
const { default: app } = await import('../src/app.js');
const { Budget } = await import('../src/models/budget.model.js');
const { Notice } = await import('../src/models/notice.model.js');
const { createUser, createAdmin, loginAgent } = await import('./helpers.js');

const api = '/api/v1/budgets';

const as = (user) => loginAgent(user);
const student = (overrides = {}) => createUser({ name: 'Riya Student', ...overrides });

const budget = async (overrides = {}) => {
    const requestedBy = overrides.requestedBy || await student();
    return Budget.create({ title: 'Sports week', category: 'event', description: 'Equipment and prizes.', requestedAmount: 20000, ...overrides, requestedBy: requestedBy._id });
};

const form = (overrides = {}) => ({ title: 'Mess utensils', category: 'mess', description: 'Replacing worn plates and glasses.', requestedAmount: 15000, ...overrides });
const decide = (agent, id, body) => agent.patch(`${api}/${id}/decision`).send(body);

beforeEach(() => storeFile.mockClear());

describe('access', () => {
    test('needs a login and an approved profile', async () => {
        const pending = await as(await student({ profileStatus: 'Pending' }));

        expect((await request(app).get(api)).status).toBe(401);
        expect((await pending.get(api)).status).toBe(403);
        expect((await pending.post(api).send(form())).status).toBe(403);
    });

    test('students and faculty request; only admins decide', async () => {
        const target = await budget();

        expect((await (await as(await student())).post(api).send(form())).status).toBe(201);
        expect((await (await as(await createUser({ role: 'faculty' }))).post(api).send(form())).status).toBe(201);

        for (const role of ['admin', 'doctor']) {
            const res = await (await as(await createUser({ role }))).post(api).send(form());
            expect(res.status).toBe(403);
        }

        for (const role of ['student', 'faculty', 'doctor']) {
            const res = await decide(await as(await createUser({ role })), target._id, { status: 'approved', approvedAmount: 100 });
            expect(res.status).toBe(403);
            expect(res.body.message).toBe('You are not allowed to do this');
        }
        expect((await Budget.findById(target._id)).status).toBe('pending');
    });
});

describe('requesting', () => {
    test('stores the request as pending, with an optional bill', async () => {
        const me = await student();
        const agent = await as(me);

        const plain = await agent.post(api).send(form());
        const withBill = await agent.post(api)
            .field('title', 'Lab consumables').field('category', 'department').field('description', 'Wires and breadboards.').field('requestedAmount', '4500.50')
            .attach('bill', Buffer.alloc(300), { filename: 'bill.pdf', contentType: 'application/pdf' });

        expect(plain.status).toBe(201);
        expect(withBill.status).toBe(201);
        const saved = await Budget.findOne({ title: 'Lab consumables' });
        expect(saved.status).toBe('pending');
        expect(saved.requestedAmount).toBe(4500.5);
        expect(saved.approvedAmount).toBeUndefined();
        expect(saved.billUrl).toBe('https://files.example/bill.pdf');
        expect(String(saved.requestedBy)).toBe(String(me._id));
        expect(storeFile.mock.calls[0][1]).toBe('budgets');
    });

    test('needs a title, a description and a known category', async () => {
        const agent = await as(await student());

        expect((await agent.post(api).send(form({ title: '' }))).body.message).toBe('Title is required');
        expect((await agent.post(api).send(form({ description: ' ' }))).body.message).toBe('Description is required');
        expect((await agent.post(api).send(form({ category: 'party' }))).body.message).toBe('Category must be one of: event, department, mess, other');
        expect(await Budget.countDocuments()).toBe(0);
    });

    test('the amount must be a sensible sum of money', async () => {
        const agent = await as(await student());
        const messageFor = async (requestedAmount) => (await agent.post(api).send(form({ requestedAmount }))).body.message;

        for (const amount of [0, -5, 'abc', '', undefined, null, { $gt: 0 }, [100], '12abc', Infinity, 'NaN', true]) {
            expect(await messageFor(amount)).toBe('Requested amount must be a number above 0');
        }
        expect(await messageFor(10.999)).toBe('Requested amount can have at most two decimals');
        expect(await messageFor(10000000.01)).toBe('Requested amount is too large');
        expect(await Budget.countDocuments()).toBe(0);

        expect((await agent.post(api).send(form({ requestedAmount: 10000000 }))).status).toBe(201);
        expect((await agent.post(api).send(form({ requestedAmount: '0.01' }))).status).toBe(201);
    });

    test('status, approved amount and decision cannot be set by the requester', async () => {
        await (await as(await student())).post(api).send(form({ status: 'approved', approvedAmount: 15000, decision: { comment: 'self' }, isDemo: true }));

        const saved = await Budget.findOne();
        expect(saved.status).toBe('pending');
        expect(saved.approvedAmount).toBeUndefined();
        expect(saved.decision).toBeUndefined();
        expect(saved.isDemo).toBe(false);
    });
});

describe('the list and totals', () => {
    test('everyone approved sees every request with the people involved', async () => {
        const me = await student({ name: 'Me Myself' });
        const admin = await createAdmin({ name: 'The Admin' });
        await budget({ requestedBy: me, title: 'Older', createdAt: new Date(Date.now() - 60000) });
        await budget({ title: 'Newer', status: 'approved', approvedAmount: 5000, decision: { by: admin._id, at: new Date() } });

        const res = await (await as(me)).get(api);

        expect(res.status).toBe(200);
        expect(res.body.data.budgets.map((item) => item.title)).toEqual(['Newer', 'Older']);
        expect(res.body.data.budgets[0].decision.by.name).toBe('The Admin');
        expect(res.body.data.budgets[1].requestedBy.name).toBe('Me Myself');
        expect(res.body.data.budgets[1].requestedBy).not.toHaveProperty('email');
        expect(res.body.data.budgets[1].mine).toBe(true);
    });

    test('totals show what was asked for and what was approved in each category', async () => {
        await budget({ category: 'event', requestedAmount: 20000, status: 'approved', approvedAmount: 15000 });
        await budget({ category: 'event', requestedAmount: 5000 });
        await budget({ category: 'event', requestedAmount: 7000, status: 'rejected' });
        await budget({ category: 'mess', requestedAmount: 1000.25, status: 'approved', approvedAmount: 1000.25 });

        const { totals } = (await (await as(await student())).get(api)).body.data;

        expect(totals).toEqual([
            { category: 'event', requested: 32000, approved: 15000 },
            { category: 'department', requested: 0, approved: 0 },
            { category: 'mess', requested: 1000.25, approved: 1000.25 },
            { category: 'other', requested: 0, approved: 0 },
        ]);
    });
});

describe('deciding', () => {
    test('an admin approves with an amount, and the requester is told', async () => {
        const admin = await createAdmin();
        const me = await student();
        const target = await budget({ requestedBy: me, title: 'Sports week', requestedAmount: 20000 });

        const res = await decide(await as(admin), target._id, { status: 'approved', approvedAmount: 15000, comment: 'Prizes reduced.' });

        expect(res.status).toBe(200);
        const saved = await Budget.findById(target._id);
        expect(saved.status).toBe('approved');
        expect(saved.approvedAmount).toBe(15000);
        expect(saved.decision.comment).toBe('Prizes reduced.');
        expect(String(saved.decision.by)).toBe(String(admin._id));
        expect(saved.decision.at).toBeInstanceOf(Date);
        const notice = await Notice.findOne({ user: me._id });
        expect(notice.title).toBe('Your budget request was approved');
        expect(notice.body).toBe('Sports week: 15000 approved of 20000 requested');
    });

    test('the approved amount must be above zero and not more than what was asked', async () => {
        const target = await budget({ requestedAmount: 20000 });
        const agent = await as(await createAdmin());

        for (const approvedAmount of [0, -1, 20000.01, undefined, 'lots', { $gt: 0 }, 10.123]) {
            const res = await decide(agent, target._id, { status: 'approved', approvedAmount });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Approved amount must be above 0 and at most the requested amount');
        }
        expect((await Budget.findById(target._id)).status).toBe('pending');

        expect((await decide(agent, target._id, { status: 'approved', approvedAmount: 20000 })).status).toBe(200);
    });

    test('rejecting needs a comment and stores no amount', async () => {
        const me = await student();
        const target = await budget({ requestedBy: me });
        const agent = await as(await createAdmin());

        const noComment = await decide(agent, target._id, { status: 'rejected' });
        const rejected = await decide(agent, target._id, { status: 'rejected', comment: 'No funds this term.', approvedAmount: 500 });

        expect(noComment.status).toBe(400);
        expect(noComment.body.message).toBe('A comment is required to reject');
        expect(rejected.status).toBe(200);
        const saved = await Budget.findById(target._id);
        expect(saved.status).toBe('rejected');
        expect(saved.approvedAmount).toBeUndefined();
        expect((await Notice.findOne({ user: me._id })).body).toBe('Sports week: No funds this term.');
    });

    test('only approved or rejected, and only once, also when two decisions arrive together', async () => {
        const target = await budget();
        const one = await as(await createAdmin());
        const two = await as(await createAdmin());

        const wrong = await decide(one, target._id, { status: 'pending' });
        const answers = await Promise.all([
            decide(one, target._id, { status: 'approved', approvedAmount: 100 }),
            decide(two, target._id, { status: 'rejected', comment: 'No.' }),
        ]);

        expect(wrong.status).toBe(400);
        expect(wrong.body.message).toBe('Status must be one of: approved, rejected');
        expect(answers.map((res) => res.status).sort()).toEqual([200, 409]);
        expect(answers.find((res) => res.status === 409).body.message).toBe('This request has already been decided');
        expect(await Notice.countDocuments()).toBe(1);
    });

    test('an unknown or malformed id is 404', async () => {
        const agent = await as(await createAdmin());
        for (const id of ['507f1f77bcf86cd799439011', 'nope']) {
            const res = await decide(agent, id, { status: 'approved', approvedAmount: 1 });
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Budget request not found');
        }
    });
});

describe('demo accounts and real data', () => {
    test('a demo request is sample data, and its bill is not stored', async () => {
        const res = await (await as(await student({ isDemo: true }))).post(api)
            .field('title', 'Sample').field('category', 'other').field('description', 'A sample request.').field('requestedAmount', '100')
            .attach('bill', Buffer.alloc(300), { filename: 'bill.pdf', contentType: 'application/pdf' });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Budget request submitted. Files are not stored for demo accounts.');
        expect((await Budget.findOne()).isDemo).toBe(true);
        expect(storeFile).not.toHaveBeenCalled();
    });

    test('the demo admin cannot decide a real request, and can decide a sample one', async () => {
        const real = await budget();
        const sample = await budget({ isDemo: true });
        const agent = await as(await createAdmin({ isDemo: true }));

        const refused = await decide(agent, real._id, { status: 'approved', approvedAmount: 1 });

        expect(refused.status).toBe(403);
        expect(refused.body.message).toBe('Demo accounts can only change sample data');
        expect((await decide(agent, sample._id, { status: 'approved', approvedAmount: 1 })).status).toBe(200);
        expect((await Budget.findById(real._id)).status).toBe('pending');
    });
});

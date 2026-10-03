import request from 'supertest';
import app from '../src/app.js';
import { Notice } from '../src/models/notice.model.js';
import { notify, notifyMany } from '../src/utils/notices.js';
import { createUser, loginAgent } from './helpers.js';

const api = '/api/v1/notices';

const login = async (overrides) => {
    const user = await createUser(overrides);
    return { user, agent: await loginAgent(user) };
};

describe('notify', () => {
    test('stores the notice for the user, unread', async () => {
        const user = await createUser();

        await notify(user._id, { type: 'profile', title: 'Your profile was approved', body: 'Welcome.', link: '/' });

        const [notice] = await Notice.find({ user: user._id });
        expect(notice.type).toBe('profile');
        expect(notice.title).toBe('Your profile was approved');
        expect(notice.body).toBe('Welcome.');
        expect(notice.link).toBe('/');
        expect(notice.readAt).toBeUndefined();
    });

    test('notifyMany leaves one notice for each user', async () => {
        const first = await createUser();
        const second = await createUser();

        await notifyMany([first._id, second._id], { type: 'leave', title: 'A student is on leave' });

        expect(await Notice.countDocuments({ user: first._id })).toBe(1);
        expect(await Notice.countDocuments({ user: second._id })).toBe(1);
    });
});

describe('reading notices', () => {
    test('every route needs a login', async () => {
        const answers = await Promise.all([
            request(app).get(api),
            request(app).patch(`${api}/507f1f77bcf86cd799439011/read`),
            request(app).patch(`${api}/read-all`),
        ]);

        expect(answers.map((res) => res.status)).toEqual([401, 401, 401]);
    });

    test('the list holds only the caller\'s notices, newest first, with the unread count', async () => {
        const { user, agent } = await login();
        const other = await createUser();
        await Notice.create({ user: user._id, type: 'a', title: 'Older', createdAt: new Date(Date.now() - 60000) });
        await Notice.create({ user: user._id, type: 'a', title: 'Newer', readAt: new Date() });
        await notify(other._id, { type: 'a', title: 'Not mine' });

        const res = await agent.get(api);

        expect(res.status).toBe(200);
        expect(res.body.data.notices.map((notice) => notice.title)).toEqual(['Newer', 'Older']);
        expect(res.body.data.unread).toBe(1);
    });

    test('a user whose profile is still pending can read notices', async () => {
        const { user, agent } = await login({ profileStatus: 'Pending' });
        await notify(user._id, { type: 'profile', title: 'Your profile was rejected' });

        const res = await agent.get(api);

        expect(res.status).toBe(200);
        expect(res.body.data.notices).toHaveLength(1);
    });

    test('marking one as read lowers the unread count', async () => {
        const { user, agent } = await login();
        const notice = await notify(user._id, { type: 'a', title: 'Read me' });
        await notify(user._id, { type: 'a', title: 'Still unread' });

        const res = await agent.patch(`${api}/${notice._id}/read`);

        expect(res.status).toBe(200);
        expect((await Notice.findById(notice._id)).readAt).toBeInstanceOf(Date);
        expect((await agent.get(api)).body.data.unread).toBe(1);
    });

    test("another user's notice, an unknown id and a malformed id are all 404", async () => {
        const { agent } = await login();
        const other = await createUser();
        const theirs = await notify(other._id, { type: 'a', title: 'Not mine' });

        for (const id of [theirs._id, '507f1f77bcf86cd799439011', 'not-an-id']) {
            const res = await agent.patch(`${api}/${id}/read`);
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Notice not found');
        }
        expect((await Notice.findById(theirs._id)).readAt).toBeUndefined();
    });

    test('read-all marks all of the caller\'s notices and nobody else\'s', async () => {
        const { user, agent } = await login();
        const other = await createUser();
        await notify(user._id, { type: 'a', title: 'One' });
        await notify(user._id, { type: 'a', title: 'Two' });
        await notify(other._id, { type: 'a', title: 'Not mine' });

        const res = await agent.patch(`${api}/read-all`);

        expect(res.status).toBe(200);
        expect(await Notice.countDocuments({ user: user._id, readAt: null })).toBe(0);
        expect(await Notice.countDocuments({ user: other._id, readAt: null })).toBe(1);
    });
});

import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Notice } from '../src/models/notice.model.js';
import { notify } from '../src/utils/notices.js';
import { DEMO_LOGINS, DEMO_PASSWORD, ensureAdmin, rebuildSampleCollege } from '../src/scripts/sampleCollege.js';
import { createUser, createAdmin, loginAgent } from './helpers.js';

const api = '/api/v1/dashboard';
const cardsOf = (res) => Object.fromEntries(res.body.data.cards.map((card) => [card.key, card.value]));

describe('dashboard', () => {
    test('needs a login and an approved profile', async () => {
        const pending = await loginAgent(await createUser({ profileStatus: 'Pending' }));

        expect((await request(app).get(api)).status).toBe(401);
        const res = await pending.get(api);
        expect(res.status).toBe(403);
        expect(res.body.message).toBe('Your profile is waiting for approval');
    });

    test('an admin sees how many profiles are waiting and how many people are approved', async () => {
        await createUser({ profileStatus: 'Pending' });
        await createUser({ role: 'faculty', profileStatus: 'Pending' });
        await createUser();
        await createUser();
        await createUser({ role: 'faculty' });
        await createUser({ profileStatus: 'Rejected' });

        const res = await (await loginAgent(await createAdmin())).get(api);

        expect(res.status).toBe(200);
        expect(res.body.data.role).toBe('admin');
        expect(cardsOf(res)).toEqual({ pendingProfiles: 2, students: 2, faculty: 1, unreadNotices: 0 });
        expect(res.body.data.cards[0]).toEqual({ key: 'pendingProfiles', label: 'Profiles waiting for approval', value: 2, link: '/pending-request' });
    });

    test('a student sees their unread notices and no admin figures', async () => {
        const user = await createUser();
        await notify(user._id, { type: 'profile', title: 'Your profile was approved' });
        await Notice.create({ user: user._id, type: 'a', title: 'Already read', readAt: new Date() });

        const res = await (await loginAgent(user)).get(api);

        expect(res.body.data.role).toBe('student');
        expect(res.body.data.unreadNotices).toBe(1);
        expect(cardsOf(res)).toEqual({ unreadNotices: 1 });
    });
});

describe('sample college', () => {
    const demoCount = () => User.countDocuments({ email: /@campus\.demo$/ });

    test('creates the four demo logins, approved and able to log in', async () => {
        await rebuildSampleCollege();

        for (const [role, email] of Object.entries(DEMO_LOGINS)) {
            const res = await request(app).post('/api/v1/users/login').send({ email, password: DEMO_PASSWORD });
            expect(res.status).toBe(200);
            expect(res.body.data.user.role).toBe(role);
            expect(res.body.data.user.isDemo).toBe(true);
        }
        expect(await User.countDocuments({ email: DEMO_LOGINS.student, profileStatus: 'Approved', isVerified: true })).toBe(1);
    });

    test('includes board members, a coordinator for the demo student\'s class and profiles to decide', async () => {
        await rebuildSampleCollege();

        const demoStudent = await User.findOne({ email: DEMO_LOGINS.student });
        const coordinator = await User.findOne({
            'coordinatorOf.department': demoStudent.department,
            'coordinatorOf.year': demoStudent.currentYear,
            'coordinatorOf.division': demoStudent.classDivision,
        });

        expect(coordinator.role).toBe('faculty');
        expect(await User.countDocuments({ isBoardMember: true })).toBe(3);
        expect(await User.countDocuments({ profileStatus: 'Pending', role: 'student' })).toBe(1);
        expect(await User.countDocuments({ profileStatus: 'Pending', role: 'faculty' })).toBe(1);
    });

    test('running it again gives the same accounts, not more', async () => {
        const first = await rebuildSampleCollege();
        const countAfterFirst = await demoCount();

        const second = await rebuildSampleCollege();

        expect(second.users).toBe(first.users);
        expect(await demoCount()).toBe(countAfterFirst);
        expect(countAfterFirst).toBe(first.users);
    });

    test('real accounts and their notices are kept; demo notices are removed', async () => {
        const real = await createUser({ email: 'real.person@gmail.com', rollNumber: 'REAL-1' });
        await notify(real._id, { type: 'profile', title: 'Your profile was approved' });
        await rebuildSampleCollege();
        const demoStudent = await User.findOne({ email: DEMO_LOGINS.student });
        await notify(demoStudent._id, { type: 'a', title: 'Left over from a visitor' });

        await rebuildSampleCollege();

        expect(await User.countDocuments({ email: 'real.person@gmail.com' })).toBe(1);
        expect(await Notice.countDocuments({ user: real._id })).toBe(1);
        expect(await Notice.countDocuments({ title: 'Left over from a visitor' })).toBe(0);
    });

    test('an address that merely contains the demo domain is not treated as a demo account', async () => {
        await createUser({ email: 'someone@campus.demo.example.com' });

        await rebuildSampleCollege();

        expect(await User.countDocuments({ email: 'someone@campus.demo.example.com' })).toBe(1);
    });
});

describe('ensureAdmin', () => {
    afterEach(() => {
        delete process.env.ADMIN_EMAIL;
        delete process.env.ADMIN_PASSWORD;
    });

    test('creates the admin once from the settings', async () => {
        process.env.ADMIN_EMAIL = 'Owner@College.edu';
        process.env.ADMIN_PASSWORD = 'owner-secret';

        expect(await ensureAdmin()).toBe(true);
        expect(await ensureAdmin()).toBe(false);

        const res = await request(app).post('/api/v1/users/login').send({ email: 'owner@college.edu', password: 'owner-secret' });
        expect(res.status).toBe(200);
        expect(res.body.data.user.role).toBe('admin');
        expect(res.body.data.user.isDemo).toBe(false);
        expect(await User.countDocuments({ role: 'admin' })).toBe(1);
    });

    test('does nothing without both settings', async () => {
        process.env.ADMIN_EMAIL = 'owner@college.edu';

        expect(await ensureAdmin()).toBe(false);
        expect(await User.countDocuments()).toBe(0);
    });
});

describe('review fixes', () => {
    test('the demo admin sees figures for the sample college only', async () => {
        await createUser({ profileStatus: 'Pending' });
        await createUser();
        await createUser({ profileStatus: 'Pending', isDemo: true });
        await createUser({ isDemo: true });
        await createUser({ role: 'faculty', isDemo: true });

        const res = await (await loginAgent(await createAdmin({ isDemo: true }))).get(api);

        expect(cardsOf(res)).toEqual({ pendingProfiles: 1, students: 1, faculty: 1, unreadNotices: 0 });
    });

    test('a rebuild keeps the same account ids, so a visitor stays logged in', async () => {
        await rebuildSampleCollege();
        const before = await User.findOne({ email: DEMO_LOGINS.student });
        const agent = await loginAgent(before, DEMO_PASSWORD);

        await rebuildSampleCollege();

        const after = await User.findOne({ email: DEMO_LOGINS.student });
        expect(String(after._id)).toBe(String(before._id));
        expect((await agent.get('/api/v1/users/me')).status).toBe(200);
    });

    test('sample-college numbers carry the reserved prefix', async () => {
        await rebuildSampleCollege();

        const numbered = await User.find({ email: /@campus\.demo$/, role: { $in: ['student', 'faculty'] } });
        expect(numbered.length).toBeGreaterThan(0);
        for (const user of numbered) {
            expect(user.rollNumber || user.facultyId).toMatch(/^DEMO-/);
        }
    });

    test('a rebuild that cannot finish is reported, not thrown, by the start-up helper', async () => {
        const { startSampleCollege } = await import('../src/scripts/sampleCollege.js');
        // a real account already holds a number the sample college needs
        await createUser({ email: 'real.person@gmail.com', rollNumber: 'DEMO-CS-TE-A-01' });
        const silenced = jest.spyOn(console, 'log').mockImplementation(() => {});

        await expect(startSampleCollege()).resolves.toBe(false);

        silenced.mockRestore();
        expect(await User.countDocuments({ email: 'real.person@gmail.com' })).toBe(1);
    });
});

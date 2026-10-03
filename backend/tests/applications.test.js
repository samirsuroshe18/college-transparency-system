import { jest } from '@jest/globals';

// files are never stored and mail is never sent in tests
const storeFile = jest.fn(async (file) => (file ? 'https://files.example/application.pdf' : null));
const sendMail = jest.fn(async () => true);
jest.unstable_mockModule('../src/utils/uploads.js', () => ({ storeFile, uploadsEnabled: () => true }));
jest.unstable_mockModule('../src/utils/mailSender.js', () => ({ default: jest.fn(async () => ({ sent: true })), sendMail }));

const request = (await import('supertest')).default;
const { default: app } = await import('../src/app.js');
const { Application } = await import('../src/models/application.model.js');
const { Notice } = await import('../src/models/notice.model.js');
const { createUser, createAdmin, loginAgent } = await import('./helpers.js');

const api = '/api/v1/applications';

const as = (user) => loginAgent(user);
const student = (overrides = {}) => createUser({ name: 'Riya Student', ...overrides });
const teacher = (overrides = {}) => createUser({ role: 'faculty', name: 'Prof. Reviewer', ...overrides });

const application = async (overrides = {}) => {
    const submittedBy = overrides.submittedBy || await student();
    return Application.create({ title: 'Tech fest', description: 'Two-day technical festival.', category: 'event', ...overrides, submittedBy: submittedBy._id });
};

const form = (overrides = {}) => ({ title: 'Coding club budget', description: 'Funds for the yearly hackathon.', category: 'budget', ...overrides });

beforeEach(() => {
    storeFile.mockClear();
    sendMail.mockClear();
});

describe('access', () => {
    test('needs a login and an approved profile', async () => {
        const pending = await as(await student({ profileStatus: 'Pending' }));

        expect((await request(app).get(api)).status).toBe(401);
        expect((await pending.get(api)).status).toBe(403);
    });

    test('students submit, faculty review, admins decide', async () => {
        const target = await application();
        const roles = { student: await student(), faculty: await teacher(), admin: await createAdmin(), doctor: await createUser({ role: 'doctor' }) };
        const attempt = {
            submit: (agent) => agent.post(api).send(form()),
            review: (agent) => agent.patch(`${api}/${target._id}/review`).send({ comment: 'Looks fine' }),
            decide: (agent) => agent.patch(`${api}/${target._id}/decision`).send({ status: 'approved' }),
        };
        const allowed = { submit: 'student', review: 'faculty', decide: 'admin' };

        for (const [action, run] of Object.entries(attempt)) {
            for (const [role, user] of Object.entries(roles)) {
                if (role === allowed[action]) continue;
                const res = await run(await as(user));
                expect(res.status).toBe(403);
                expect(res.body.message).toBe('You are not allowed to do this');
            }
        }
        expect(await Application.countDocuments()).toBe(1);
        expect((await Application.findById(target._id)).status).toBe('pending');
    });
});

describe('submitting', () => {
    test('a student submits an application, with an optional file', async () => {
        const me = await student();
        const agent = await as(me);

        const plain = await agent.post(api).send(form());
        const withFile = await agent.post(api)
            .field('title', 'Sponsorship for robotics').field('description', 'A sponsor for the robotics team.').field('category', 'sponsorship')
            .attach('file', Buffer.alloc(400), { filename: 'proposal.pdf', contentType: 'application/pdf' });

        expect(plain.status).toBe(201);
        expect(withFile.status).toBe(201);
        const saved = await Application.findOne({ category: 'sponsorship' });
        expect(saved.status).toBe('pending');
        expect(String(saved.submittedBy)).toBe(String(me._id));
        expect(saved.fileUrl).toBe('https://files.example/application.pdf');
        expect(storeFile.mock.calls[0][1]).toBe('applications');
        expect((await Application.findOne({ category: 'budget' })).fileUrl).toBeUndefined();
    });

    test('needs a title, a description and a known category', async () => {
        const agent = await as(await student());

        expect((await agent.post(api).send(form({ title: '' }))).body.message).toBe('Title is required');
        expect((await agent.post(api).send(form({ description: undefined }))).body.message).toBe('Description is required');
        expect((await agent.post(api).send(form({ category: undefined }))).body.message).toBe('Category is required');
        expect((await agent.post(api).send(form({ category: 'party' }))).body.message).toBe('Category must be one of: event, budget, sponsorship');
        expect((await agent.post(api).send(form({ title: 'a'.repeat(121) }))).body.message).toBe('Title must be at most 120 characters');
        expect(await Application.countDocuments()).toBe(0);
        expect(storeFile).not.toHaveBeenCalled();
    });

    test('status, review and decision cannot be set by the applicant', async () => {
        await (await as(await student())).post(api).send(form({ status: 'approved', decision: { comment: 'Self approved' }, review: { comment: 'x' }, isDemo: true }));

        const saved = await Application.findOne();
        expect(saved.status).toBe('pending');
        expect(saved.decision).toBeUndefined();
        expect(saved.review).toBeUndefined();
        expect(saved.isDemo).toBe(false);
    });
});

describe('the list', () => {
    test('everyone approved sees every application with the people involved; "mine" narrows it', async () => {
        const me = await student({ name: 'Me Myself' });
        const reviewer = await teacher();
        await application({ submittedBy: me, title: 'Mine', createdAt: new Date(Date.now() - 60000) });
        await application({ title: 'Theirs', review: { comment: 'Good plan', by: reviewer._id, at: new Date() } });
        const agent = await as(me);

        const all = await agent.get(api);
        const mine = await agent.get(api).query({ mine: 'true' });

        expect(all.status).toBe(200);
        expect(all.body.data.applications.map((item) => item.title)).toEqual(['Theirs', 'Mine']);
        expect(all.body.data.applications[0].review.by.name).toBe('Prof. Reviewer');
        expect(all.body.data.applications[1].submittedBy.name).toBe('Me Myself');
        expect(all.body.data.applications[1].submittedBy).not.toHaveProperty('email');
        expect(all.body.data.applications[1].mine).toBe(true);
        expect(mine.body.data.applications.map((item) => item.title)).toEqual(['Mine']);
    });
});

describe('reviewing', () => {
    test('a faculty member adds a review comment; the application stays pending', async () => {
        const reviewer = await teacher();
        const target = await application();

        const res = await (await as(reviewer)).patch(`${api}/${target._id}/review`).send({ comment: ' The budget looks reasonable. ' });

        expect(res.status).toBe(200);
        const saved = await Application.findById(target._id);
        expect(saved.status).toBe('pending');
        expect(saved.review.comment).toBe('The budget looks reasonable.');
        expect(String(saved.review.by)).toBe(String(reviewer._id));
        expect(saved.review.at).toBeInstanceOf(Date);
    });

    test('needs a comment, and only a pending application can be reviewed', async () => {
        const agent = await as(await teacher());
        const pending = await application();
        const decided = await application({ status: 'approved' });

        const noComment = await agent.patch(`${api}/${pending._id}/review`).send({ comment: '' });
        const tooLate = await agent.patch(`${api}/${decided._id}/review`).send({ comment: 'Late thoughts' });

        expect(noComment.status).toBe(400);
        expect(noComment.body.message).toBe('Comment is required');
        expect(tooLate.status).toBe(409);
        expect(tooLate.body.message).toBe('This application has already been decided');
    });
});

describe('deciding', () => {
    const decide = (agent, id, body) => agent.patch(`${api}/${id}/decision`).send(body);

    test('an admin approves; the applicant gets a notice and an email', async () => {
        const admin = await createAdmin();
        const me = await student({ email: 'riya@college.edu' });
        const target = await application({ submittedBy: me, title: 'Tech fest' });

        const res = await decide(await as(admin), target._id, { status: 'approved', comment: 'Approved for March.' });

        expect(res.status).toBe(200);
        const saved = await Application.findById(target._id);
        expect(saved.status).toBe('approved');
        expect(saved.decision.comment).toBe('Approved for March.');
        expect(String(saved.decision.by)).toBe(String(admin._id));
        const notice = await Notice.findOne({ user: me._id });
        expect(notice.title).toBe('Your application was approved');
        expect(notice.body).toBe('Tech fest');
        expect(sendMail).toHaveBeenCalledTimes(1);
        const [to, subject, text] = sendMail.mock.calls[0];
        expect(to).toBe('riya@college.edu');
        expect(subject).toBe('Your application was approved');
        expect(text).toContain('Tech fest');
        expect(text).toContain('Approved for March.');
    });

    test('rejecting needs a comment', async () => {
        const target = await application();
        const agent = await as(await createAdmin());

        const noComment = await decide(agent, target._id, { status: 'rejected' });
        const rejected = await decide(agent, target._id, { status: 'rejected', comment: 'No budget this term.' });

        expect(noComment.status).toBe(400);
        expect(noComment.body.message).toBe('A comment is required to reject');
        expect(rejected.status).toBe(200);
        expect((await Application.findById(target._id)).status).toBe('rejected');
    });

    test('only approved or rejected, and only once, also when two decisions arrive together', async () => {
        const target = await application();
        const one = await as(await createAdmin());
        const two = await as(await createAdmin());

        const wrong = await decide(one, target._id, { status: 'pending' });
        const answers = await Promise.all([
            decide(one, target._id, { status: 'approved' }),
            decide(two, target._id, { status: 'rejected', comment: 'No.' }),
        ]);

        expect(wrong.status).toBe(400);
        expect(wrong.body.message).toBe('Status must be one of: approved, rejected');
        expect(answers.map((res) => res.status).sort()).toEqual([200, 409]);
        expect(answers.find((res) => res.status === 409).body.message).toBe('This application has already been decided');
        expect(await Notice.countDocuments()).toBe(1);
        expect(sendMail).toHaveBeenCalledTimes(1);
    });

    test('a mail that cannot be sent does not undo the decision', async () => {
        sendMail.mockResolvedValueOnce(false);
        const target = await application();

        const res = await decide(await as(await createAdmin()), target._id, { status: 'approved' });

        expect(res.status).toBe(200);
        expect((await Application.findById(target._id)).status).toBe('approved');
    });

    test('an unknown or malformed id is 404 for review and decision', async () => {
        const admin = await as(await createAdmin());
        const reviewer = await as(await teacher());

        for (const id of ['507f1f77bcf86cd799439011', 'nope']) {
            for (const res of [await decide(admin, id, { status: 'approved' }), await reviewer.patch(`${api}/${id}/review`).send({ comment: 'x' })]) {
                expect(res.status).toBe(404);
                expect(res.body.message).toBe('Application not found');
            }
        }
    });
});

describe('demo accounts and real data', () => {
    test('a demo applicant makes sample data and is never emailed', async () => {
        const demoStudent = await student({ isDemo: true });
        await (await as(demoStudent)).post(api).send(form());
        const target = await Application.findOne();

        const res = await (await as(await createAdmin({ isDemo: true }))).patch(`${api}/${target._id}/decision`).send({ status: 'approved' });

        expect(target.isDemo).toBe(true);
        expect(res.status).toBe(200);
        expect(sendMail).not.toHaveBeenCalled();
        expect(await Notice.countDocuments({ user: demoStudent._id })).toBe(1);
    });

    test('demo faculty and the demo admin cannot review or decide a real application', async () => {
        const real = await application();

        const review = await (await as(await teacher({ isDemo: true }))).patch(`${api}/${real._id}/review`).send({ comment: 'x' });
        const decision = await (await as(await createAdmin({ isDemo: true }))).patch(`${api}/${real._id}/decision`).send({ status: 'approved' });

        for (const res of [review, decision]) {
            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Demo accounts can only change sample data');
        }
        expect((await Application.findById(real._id)).status).toBe('pending');
        expect(sendMail).not.toHaveBeenCalled();
    });
});

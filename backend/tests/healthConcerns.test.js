import { jest } from '@jest/globals';

// no real email and no real file store in tests
const sendMail = jest.fn(async () => true);
jest.unstable_mockModule('../src/utils/mailSender.js', () => ({ default: jest.fn(async () => ({ sent: true })), sendMail }));
const storeFile = jest.fn(async (file) => (file ? 'https://files.example/report.pdf' : null));
jest.unstable_mockModule('../src/utils/uploads.js', () => ({ storeFile, uploadsEnabled: () => true }));

const request = (await import('supertest')).default;
const { default: app } = await import('../src/app.js');
const { HealthConcern } = await import('../src/models/healthConcern.model.js');
const { Notice } = await import('../src/models/notice.model.js');
const { collegeToday, collegeDayFromNow } = await import('../src/utils/collegeTime.js');
const { createUser, createAdmin, loginAgent } = await import('./helpers.js');

const concerns = '/api/v1/health-concerns';
const leaves = '/api/v1/leaves';

const as = (user) => loginAgent(user);
const inClass = { department: 'Computer', currentYear: 'TE', classDivision: 'A' };
const student = (overrides = {}) => createUser({
    name: 'Meera Student', ...inClass,
    emergencyContact: { name: 'Asha', relation: 'Mother', contact: '9000000001' },
    ...overrides,
});
const doctor = (overrides = {}) => createUser({ role: 'doctor', name: 'Dr. Rao', ...overrides });
const coordinator = (overrides = {}) => createUser({
    role: 'faculty', name: 'Prof. Coordinator', coordinatorOf: { department: 'Computer', year: 'TE', division: 'A' }, ...overrides,
});

const concern = async (overrides = {}) => {
    const owner = overrides.student || await student();
    return HealthConcern.create({ symptoms: 'Fever and headache', ...overrides, student: owner._id });
};

const onLeave = async (owner, days = 2, overrides = {}) => concern({
    student: owner, status: 'assessed', isDemo: owner.isDemo,
    assessment: { diagnosis: 'Viral fever', leaveDays: days, at: new Date() },
    leaveFrom: collegeToday(), leaveUntil: collegeDayFromNow(days - 1),
    ...overrides,
});

beforeEach(() => {
    sendMail.mockClear();
    storeFile.mockClear();
});

describe('access', () => {
    test('needs a login', async () => {
        expect((await request(app).get(concerns)).status).toBe(401);
        expect((await request(app).get(leaves)).status).toBe(401);
    });

    test('only students report a concern, only doctors assess one', async () => {
        const existing = await concern();

        for (const user of [await createAdmin(), await coordinator(), await doctor()]) {
            const res = await (await as(user)).post(concerns).send({ symptoms: 'Cough' });
            expect(res.status).toBe(403);
        }

        for (const user of [await createAdmin(), await coordinator(), await student()]) {
            const res = await (await as(user)).patch(`${concerns}/${existing._id}/assess`).send({ diagnosis: 'x', leaveDays: 0 });
            expect(res.status).toBe(403);
        }

        expect(await HealthConcern.countDocuments()).toBe(1);
        expect((await HealthConcern.findOne()).status).toBe('open');
    });

    test('health concerns are closed to admins and faculty', async () => {
        await concern();

        for (const user of [await createAdmin(), await coordinator()]) {
            const res = await (await as(user)).get(concerns);
            expect(res.status).toBe(403);
            expect(res.body.data).toBeUndefined();
        }
    });

    test('leave lists are closed to admins and to faculty who coordinate no class', async () => {
        await onLeave(await student());

        for (const user of [await createAdmin(), await createUser({ role: 'faculty' })]) {
            expect((await (await as(user)).get(leaves)).status).toBe(403);
        }
    });
});

describe('reporting a concern', () => {
    test('a student reports a concern', async () => {
        const owner = await student();

        const res = await (await as(owner)).post(concerns)
            .send({ symptoms: ' Fever since last night ', description: 'High temperature.', urgency: 'urgent' });

        expect(res.status).toBe(201);
        const saved = await HealthConcern.findOne();
        expect(String(saved.student)).toBe(String(owner._id));
        expect(saved.symptoms).toBe('Fever since last night');
        expect(saved.description).toBe('High temperature.');
        expect(saved.urgency).toBe('urgent');
        expect(saved.status).toBe('open');
        expect(saved.isDemo).toBe(false);
    });

    test('urgency is normal unless said, and nothing else is read from the form', async () => {
        const res = await (await as(await student())).post(concerns).send({
            symptoms: 'Cough', status: 'assessed', leaveFrom: '2026-01-01', leaveUntil: '2026-12-31',
            assessment: { diagnosis: 'Self made', leaveDays: 30 },
        });

        expect(res.status).toBe(201);
        const saved = await HealthConcern.findOne();
        expect(saved.urgency).toBe('normal');
        expect(saved.status).toBe('open');
        expect(saved.assessment).toBeUndefined();
        expect(saved.leaveUntil).toBeUndefined();
    });

    test('symptoms are required and urgency is one of two', async () => {
        const agent = await as(await student());

        expect((await agent.post(concerns).send({ description: 'x' })).body.message).toBe('Symptoms is required');
        expect((await agent.post(concerns).send({ symptoms: 'Cough', urgency: 'critical' })).status).toBe(400);
        expect((await agent.post(concerns).send({ symptoms: { $gt: '' } })).status).toBe(400);
        expect(await HealthConcern.countDocuments()).toBe(0);
    });

    test('a report can carry a file', async () => {
        const res = await (await as(await student())).post(concerns)
            .field('symptoms', 'Sprained ankle')
            .attach('attachment', Buffer.alloc(300), { filename: 'report.pdf', contentType: 'application/pdf' });

        expect(res.status).toBe(201);
        expect((await HealthConcern.findOne()).attachmentUrl).toBe('https://files.example/report.pdf');
        expect(storeFile.mock.calls[0][1]).toBe('health');
    });
});

describe('reading concerns', () => {
    test('a student sees only their own', async () => {
        const owner = await student();
        await concern({ student: owner, symptoms: 'Mine' });
        await concern({ symptoms: 'Somebody else' });

        const res = await (await as(owner)).get(concerns);

        expect(res.status).toBe(200);
        expect(res.body.data.concerns.map((item) => item.symptoms)).toEqual(['Mine']);
    });

    test('a doctor sees every concern, urgent open ones first, then open, then assessed', async () => {
        await concern({ symptoms: 'Assessed', status: 'assessed' });
        await concern({ symptoms: 'Open normal' });
        await concern({ symptoms: 'Open urgent', urgency: 'urgent' });
        await concern({ symptoms: 'Assessed urgent', urgency: 'urgent', status: 'assessed' });

        const res = await (await as(await doctor())).get(concerns);

        expect(res.body.data.concerns.map((item) => item.symptoms).slice(0, 2)).toEqual(['Open urgent', 'Open normal']);
        expect(res.body.data.concerns).toHaveLength(4);
        expect(res.body.data.concerns[0].student.name).toBe('Meera Student');
        expect(res.body.data.concerns[0].student).not.toHaveProperty('email');
    });

    test('the doctor is shown whom to call; the contact is the student\'s own to know', async () => {
        const owner = await student();
        await concern({ student: owner, urgency: 'urgent' });

        const forDoctor = (await (await as(await doctor())).get(concerns)).body.data.concerns[0];

        expect(forDoctor.student.emergencyContact).toMatchObject({ name: 'Asha', relation: 'Mother', contact: '9000000001' });
        expect(forDoctor.student).not.toHaveProperty('email');
        expect(forDoctor.student).not.toHaveProperty('address');
    });

    test('open concerns are never pushed out of the doctor\'s list by assessed ones', async () => {
        const owner = await student();
        await concern({ student: owner, symptoms: 'Old and still open', createdAt: new Date(Date.now() - 86400000) });
        await HealthConcern.insertMany(Array.from({ length: 305 }, () => ({ student: owner._id, symptoms: 'Done', status: 'assessed' })));

        const list = (await (await as(await doctor())).get(concerns)).body.data.concerns;

        expect(list[0].symptoms).toBe('Old and still open');
    });

    test('the demo doctor sees only sample concerns', async () => {
        await concern({ symptoms: 'A real one' });
        await concern({ symptoms: 'A sample one', isDemo: true });

        const res = await (await as(await doctor({ isDemo: true }))).get(concerns);

        expect(res.body.data.concerns.map((item) => item.symptoms)).toEqual(['A sample one']);
    });
});

describe('assessing', () => {
    test('a doctor assesses a concern and gives leave in college days', async () => {
        const owner = await student();
        const existing = await concern({ student: owner });
        const medic = await doctor();

        const res = await (await as(medic)).patch(`${concerns}/${existing._id}/assess`)
            .send({ diagnosis: ' Viral fever. Rest and fluids. ', leaveDays: 3 });

        expect(res.status).toBe(200);
        const saved = await HealthConcern.findById(existing._id);
        expect(saved.status).toBe('assessed');
        expect(saved.assessment.diagnosis).toBe('Viral fever. Rest and fluids.');
        expect(saved.assessment.leaveDays).toBe(3);
        expect(String(saved.assessment.by)).toBe(String(medic._id));
        expect(saved.leaveFrom).toBe(collegeToday());
        expect(saved.leaveUntil).toBe(collegeDayFromNow(2));
    });

    test('with leave, the student and the class coordinator are told and mailed', async () => {
        const owner = await student();
        const guide = await coordinator();
        const elsewhere = await coordinator({ coordinatorOf: { department: 'Computer', year: 'TE', division: 'B' } });
        const existing = await concern({ student: owner });

        await (await as(await doctor())).patch(`${concerns}/${existing._id}/assess`).send({ diagnosis: 'Viral fever', leaveDays: 2 });

        const forStudent = await Notice.findOne({ user: owner._id });
        const forGuide = await Notice.findOne({ user: guide._id });
        expect(forStudent.title).toBe('You were given 2 days of medical leave');
        expect(forGuide.title).toBe('Meera Student is on medical leave');
        expect(forGuide.body).toBe(`${collegeToday()} to ${collegeDayFromNow(1)}`);
        expect(await Notice.countDocuments({ user: elsewhere._id })).toBe(0);

        expect(sendMail.mock.calls.map((call) => call[0]).sort()).toEqual([guide.email, owner.email].sort());
    });

    test('nothing medical reaches the coordinator', async () => {
        const owner = await student();
        const guide = await coordinator();
        const existing = await concern({ student: owner, symptoms: 'Private symptom' });

        await (await as(await doctor())).patch(`${concerns}/${existing._id}/assess`).send({ diagnosis: 'Private diagnosis', leaveDays: 1 });

        const notice = await Notice.findOne({ user: guide._id });
        const mail = sendMail.mock.calls.find((call) => call[0] === guide.email);
        for (const text of [notice.title, notice.body, mail[1], mail[2]]) {
            expect(text).not.toMatch(/Private/);
        }
        expect(mail[2]).toMatch(/Meera Student/);
    });

    test('without leave, only the student is told and nobody is mailed', async () => {
        const owner = await student();
        const guide = await coordinator();
        const existing = await concern({ student: owner });

        const res = await (await as(await doctor())).patch(`${concerns}/${existing._id}/assess`).send({ diagnosis: 'Nothing serious', leaveDays: 0 });

        expect(res.status).toBe(200);
        const saved = await HealthConcern.findById(existing._id);
        expect(saved.leaveFrom).toBeUndefined();
        expect(saved.leaveUntil).toBeUndefined();
        expect((await Notice.findOne({ user: owner._id })).title).toBe('Your health concern was assessed');
        expect(await Notice.countDocuments({ user: guide._id })).toBe(0);
        expect(sendMail).not.toHaveBeenCalled();
    });

    test('leave days are a whole number from 0 to 30, and a diagnosis is required', async () => {
        const existing = await concern();
        const agent = await as(await doctor());
        const url = `${concerns}/${existing._id}/assess`;

        for (const leaveDays of [-1, 31, 1.5, 'three', '', undefined, null, [2], { $gt: 0 }, true]) {
            const res = await agent.patch(url).send({ diagnosis: 'Viral fever', leaveDays });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Leave days must be a whole number from 0 to 30');
        }

        expect((await agent.patch(url).send({ leaveDays: 2 })).body.message).toBe('Diagnosis is required');
        expect((await HealthConcern.findById(existing._id)).status).toBe('open');
        expect((await agent.patch(url).send({ diagnosis: 'Viral fever', leaveDays: '30' })).status).toBe(200);
    });

    test('two assessments sent together: one is saved, the other refused', async () => {
        const owner = await student();
        const existing = await concern({ student: owner });
        const agent = await as(await doctor());
        const url = `${concerns}/${existing._id}/assess`;

        const answers = await Promise.all([
            agent.patch(url).send({ diagnosis: 'One', leaveDays: 1 }),
            agent.patch(url).send({ diagnosis: 'Two', leaveDays: 2 }),
        ]);

        expect(answers.map((res) => res.status).sort()).toEqual([200, 409]);
        expect(await Notice.countDocuments({ user: owner._id })).toBe(1);
    });

    test('a concern is assessed once', async () => {
        const existing = await concern();
        const agent = await as(await doctor());
        const url = `${concerns}/${existing._id}/assess`;

        await agent.patch(url).send({ diagnosis: 'First', leaveDays: 1 });
        const again = await agent.patch(url).send({ diagnosis: 'Second', leaveDays: 9 });

        expect(again.status).toBe(409);
        expect(again.body.message).toBe('This concern has already been assessed');
        expect((await HealthConcern.findById(existing._id)).assessment.diagnosis).toBe('First');
    });

    test('an unknown or malformed id is 404', async () => {
        const agent = await as(await doctor());
        for (const id of ['507f1f77bcf86cd799439011', 'nope']) {
            const res = await agent.patch(`${concerns}/${id}/assess`).send({ diagnosis: 'x', leaveDays: 0 });
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Health concern not found');
        }
    });
});

describe('demo accounts and real data', () => {
    test('the demo doctor cannot assess a real concern', async () => {
        const existing = await concern();

        const res = await (await as(await doctor({ isDemo: true }))).patch(`${concerns}/${existing._id}/assess`).send({ diagnosis: 'x', leaveDays: 1 });

        expect(res.status).toBe(403);
        expect(res.body.message).toBe('Demo accounts can only change sample data');
        expect((await HealthConcern.findById(existing._id)).status).toBe('open');
    });

    test('a sample student\'s leave reaches the sample coordinator only, by notice and not by mail', async () => {
        const owner = await student({ isDemo: true });
        const sampleGuide = await coordinator({ isDemo: true });
        const realGuide = await coordinator();
        const existing = await (await as(owner)).post(concerns).send({ symptoms: 'Cough' });

        expect((await HealthConcern.findOne()).isDemo).toBe(true);
        const res = await (await as(await doctor({ isDemo: true })))
            .patch(`${concerns}/${existing.body.data.concern._id}/assess`).send({ diagnosis: 'Cold', leaveDays: 1 });

        expect(res.status).toBe(200);
        expect(await Notice.countDocuments({ user: owner._id })).toBe(1);
        expect(await Notice.countDocuments({ user: sampleGuide._id })).toBe(1);
        expect(await Notice.countDocuments({ user: realGuide._id })).toBe(0);
        expect(sendMail).not.toHaveBeenCalled();
    });

    test('files are not stored for a demo student', async () => {
        const res = await (await as(await student({ isDemo: true }))).post(concerns)
            .field('symptoms', 'Cough')
            .attach('attachment', Buffer.alloc(300), { filename: 'report.pdf', contentType: 'application/pdf' });

        expect(res.status).toBe(201);
        expect(storeFile).not.toHaveBeenCalled();
    });
});

describe('leave lists', () => {
    test('a student sees their own leaves', async () => {
        const owner = await student();
        await onLeave(owner, 2);
        await onLeave(await student({ name: 'Other Student' }), 5);
        await concern({ student: owner, status: 'assessed', assessment: { diagnosis: 'Fine', leaveDays: 0 } });

        const res = await (await as(owner)).get(leaves);

        expect(res.status).toBe(200);
        expect(res.body.data.leaves).toHaveLength(1);
        expect(res.body.data.leaves[0]).toMatchObject({ leaveDays: 2, leaveFrom: collegeToday(), leaveUntil: collegeDayFromNow(1) });
    });

    test('a coordinator sees the leaves of their class, with the emergency contact and nothing medical', async () => {
        await onLeave(await student({ rollNumber: 'CS-11' }), 3);
        await onLeave(await student({ name: 'Other Division', classDivision: 'B' }), 3);
        await onLeave(await student({ name: 'Not Approved', profileStatus: 'Pending' }), 3);

        const res = await (await as(await coordinator())).get(leaves);

        expect(res.status).toBe(200);
        expect(res.body.data.leaves).toHaveLength(1);
        const [leave] = res.body.data.leaves;
        expect(leave.student).toMatchObject({ name: 'Meera Student', rollNumber: 'CS-11' });
        expect(leave.student.emergencyContact).toMatchObject({ name: 'Asha', relation: 'Mother', contact: '9000000001' });
        expect(leave.leaveDays).toBe(3);
        expect(JSON.stringify(res.body)).not.toMatch(/Viral fever|Fever and headache/);
        expect(leave).not.toHaveProperty('assessment');
        expect(leave).not.toHaveProperty('symptoms');
    });

    test('the demo coordinator sees only sample students', async () => {
        await onLeave(await student({ name: 'Real Student' }), 2);
        await onLeave(await student({ name: 'Sample Student', isDemo: true }), 2);

        const res = await (await as(await coordinator({ isDemo: true }))).get(leaves);

        expect(res.body.data.leaves.map((leave) => leave.student.name)).toEqual(['Sample Student']);
    });

    test('a doctor sees every leave within reach', async () => {
        await onLeave(await student(), 2);
        await onLeave(await student({ classDivision: 'B', isDemo: true }), 4);

        expect((await (await as(await doctor())).get(leaves)).body.data.leaves).toHaveLength(2);
        expect((await (await as(await doctor({ isDemo: true }))).get(leaves)).body.data.leaves).toHaveLength(1);
    });
});

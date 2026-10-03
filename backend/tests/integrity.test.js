import { jest } from '@jest/globals';

// files are never really stored in tests
const storeFile = jest.fn(async (file) => (file ? 'https://files.example/proof.png' : null));
jest.unstable_mockModule('../src/utils/uploads.js', () => ({ storeFile, uploadsEnabled: () => true }));

const request = (await import('supertest')).default;
const { default: app } = await import('../src/app.js');
const { IntegrityRecord } = await import('../src/models/integrityRecord.model.js');
const { Notice } = await import('../src/models/notice.model.js');
const { User } = await import('../src/models/user.model.js');
const { createUser, createAdmin, loginAgent } = await import('./helpers.js');

const api = '/api/v1/integrity';

const as = (user) => loginAgent(user);
const teacher = (overrides = {}) => createUser({ role: 'faculty', name: 'Prof. Recorder', ...overrides });
const student = (overrides = {}) => createUser({ name: 'Kabir Student', rollNumber: 'CS-201', department: 'Computer', currentYear: 'TE', ...overrides });

const record = async (overrides = {}) => {
    const target = overrides.student || await student({ rollNumber: `R-${Math.random().toString(36).slice(2, 8)}` });
    return IntegrityRecord.create({
        studentName: target.name, rollNumber: target.rollNumber, department: target.department, year: target.currentYear,
        reason: 'Copied in the unit test.', ...overrides, student: target._id,
    });
};

beforeAll(async () => {
    await User.init();
});

beforeEach(() => storeFile.mockClear());

describe('access', () => {
    test('needs a login and an approved profile', async () => {
        const pending = await as(await createUser({ profileStatus: 'Pending' }));

        expect((await request(app).get(api)).status).toBe(401);
        expect((await pending.get(api)).status).toBe(403);
    });

    test('faculty and admins record; only admins remove', async () => {
        const target = await student();
        const existing = await record();

        for (const role of ['student', 'doctor']) {
            const res = await (await as(await createUser({ role }))).post(api).send({ rollNumber: target.rollNumber, reason: 'x' });
            expect(res.status).toBe(403);
            expect(res.body.message).toBe('You are not allowed to do this');
        }

        for (const role of ['student', 'faculty', 'doctor']) {
            const res = await (await as(await createUser({ role }))).delete(`${api}/${existing._id}`);
            expect(res.status).toBe(403);
        }

        expect(await IntegrityRecord.countDocuments()).toBe(1);
    });
});

describe('recording', () => {
    test('a faculty member records a case against a student found by roll number', async () => {
        const recorder = await teacher();
        const target = await student({ classDivision: 'A' });

        const res = await (await as(recorder)).post(api).send({ rollNumber: ' CS-201 ', reason: 'Used a phone during the internal test.' });

        expect(res.status).toBe(201);
        const saved = await IntegrityRecord.findOne();
        expect(String(saved.student)).toBe(String(target._id));
        expect(saved.studentName).toBe('Kabir Student');
        expect(saved.rollNumber).toBe('CS-201');
        expect(saved.department).toBe('Computer');
        expect(saved.year).toBe('TE');
        expect(saved.reason).toBe('Used a phone during the internal test.');
        expect(String(saved.recordedBy)).toBe(String(recorder._id));
        expect(saved.isDemo).toBe(false);
    });

    test('the student is told, and an admin can record too, with proof', async () => {
        const target = await student();

        const res = await (await as(await createAdmin())).post(api)
            .field('rollNumber', 'CS-201').field('reason', 'Submitted a copied assignment.')
            .attach('proof', Buffer.alloc(300), { filename: 'proof.png', contentType: 'image/png' });

        expect(res.status).toBe(201);
        expect((await IntegrityRecord.findOne()).proofUrl).toBe('https://files.example/proof.png');
        expect(storeFile.mock.calls[0][1]).toBe('integrity');
        const notice = await Notice.findOne({ user: target._id });
        expect(notice.title).toBe('An integrity record was made about you');
        expect(notice.body).toBe('Submitted a copied assignment.');
    });

    test('needs a roll number and a reason', async () => {
        await student();
        const agent = await as(await teacher());

        expect((await agent.post(api).send({ reason: 'x' })).body.message).toBe('Roll number is required');
        expect((await agent.post(api).send({ rollNumber: 'CS-201' })).body.message).toBe('Reason is required');
        expect((await agent.post(api).send({ rollNumber: 'CS-201', reason: 'a'.repeat(501) })).body.message).toBe('Reason must be at most 500 characters');
        expect(await IntegrityRecord.countDocuments()).toBe(0);
    });

    test('the roll number must belong to an approved student', async () => {
        await student({ rollNumber: 'PENDING-1', profileStatus: 'Pending' });
        await teacher({ facultyId: 'FAC-9' });
        const agent = await as(await teacher());

        for (const rollNumber of ['NO-SUCH-ROLL', 'PENDING-1', 'FAC-9', { $ne: null }]) {
            const res = await agent.post(api).send({ rollNumber, reason: 'A reason.' });
            expect([400, 404]).toContain(res.status);
            expect(await IntegrityRecord.countDocuments()).toBe(0);
        }

        const res = await agent.post(api).send({ rollNumber: 'NO-SUCH-ROLL', reason: 'A reason.' });
        expect(res.status).toBe(404);
        expect(res.body.message).toBe('No approved student has this roll number');
    });

    test('no file is stored for a record that is refused', async () => {
        const res = await (await as(await teacher())).post(api)
            .field('rollNumber', 'NO-SUCH-ROLL').field('reason', 'A reason.')
            .attach('proof', Buffer.alloc(300), { filename: 'proof.png', contentType: 'image/png' });

        expect(res.status).toBe(404);
        expect(storeFile).not.toHaveBeenCalled();
    });
});

describe('the list', () => {
    test('every approved user sees the records, newest first, with who recorded them', async () => {
        const recorder = await teacher({ name: 'Prof. Recorder' });
        await record({ reason: 'Older case', recordedBy: recorder._id, createdAt: new Date(Date.now() - 60000) });
        await record({ reason: 'Newer case', recordedBy: recorder._id });

        const res = await (await as(await createUser())).get(api);

        expect(res.status).toBe(200);
        expect(res.body.data.records.map((item) => item.reason)).toEqual(['Newer case', 'Older case']);
        expect(res.body.data.records[0].recordedBy.name).toBe('Prof. Recorder');
        expect(res.body.data.records[0].recordedBy).not.toHaveProperty('email');
        expect(res.body.data.records[0].studentName).toBe('Kabir Student');
    });

    test('a record keeps the student\'s details as they were, even if the profile changes later', async () => {
        const target = await student();
        await record({ student: target });
        await target.updateOne({ currentYear: 'BE', name: 'Kabir Renamed' });

        const [item] = (await (await as(await createUser())).get(api)).body.data.records;

        expect(item.year).toBe('TE');
        expect(item.studentName).toBe('Kabir Student');
    });
});

describe('removing', () => {
    test('an admin removes a record', async () => {
        const existing = await record();

        const res = await (await as(await createAdmin())).delete(`${api}/${existing._id}`);

        expect(res.status).toBe(200);
        expect(await IntegrityRecord.countDocuments()).toBe(0);
    });

    test('an unknown or malformed id is 404', async () => {
        const agent = await as(await createAdmin());
        for (const id of ['507f1f77bcf86cd799439011', 'nope']) {
            const res = await agent.delete(`${api}/${id}`);
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Record not found');
        }
    });
});

describe('demo accounts and real data', () => {
    test('demo staff can record only against sample students', async () => {
        const real = await student({ rollNumber: 'REAL-1' });
        await student({ rollNumber: 'DEMO-CS-1', isDemo: true });
        const agent = await as(await teacher({ isDemo: true }));

        const refused = await agent.post(api).send({ rollNumber: 'REAL-1', reason: 'A reason.' });
        const allowed = await agent.post(api).send({ rollNumber: 'DEMO-CS-1', reason: 'A reason.' });

        expect(refused.status).toBe(403);
        expect(refused.body.message).toBe('Demo accounts can only change sample data');
        expect(allowed.status).toBe(201);
        expect((await IntegrityRecord.findOne()).isDemo).toBe(true);
        expect(await Notice.countDocuments({ user: real._id })).toBe(0);
    });

    test('a record made by real staff against a sample student is sample data', async () => {
        await student({ rollNumber: 'DEMO-CS-1', isDemo: true });

        await (await as(await teacher())).post(api).send({ rollNumber: 'DEMO-CS-1', reason: 'A reason.' });

        expect((await IntegrityRecord.findOne()).isDemo).toBe(true);
    });

    test('the demo admin cannot remove a real record', async () => {
        const real = await record();
        const sample = await record({ isDemo: true });
        const agent = await as(await createAdmin({ isDemo: true }));

        expect((await agent.delete(`${api}/${real._id}`)).status).toBe(403);
        expect((await agent.delete(`${api}/${sample._id}`)).status).toBe(200);
        expect(await IntegrityRecord.countDocuments()).toBe(1);
    });
});

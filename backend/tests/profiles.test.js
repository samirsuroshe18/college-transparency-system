import { jest } from '@jest/globals';

// files are never really stored in tests; this stands in for the file store
const storeFile = jest.fn(async (file) => (file ? 'https://files.example/id-proof.png' : null));
jest.unstable_mockModule('../src/utils/uploads.js', () => ({
    storeFile,
    uploadsEnabled: () => true,
}));

const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/user.model.js');
const { Notice } = await import('../src/models/notice.model.js');
const { createUser, createAdmin, loginAgent } = await import('./helpers.js');

const api = '/api/v1/profiles';

const studentForm = (overrides = {}) => ({
    department: 'Computer',
    currentYear: 'TE',
    classDivision: 'A',
    rollNumber: 'CS-101',
    phoneNumber: '9876543210',
    ...overrides,
});

const facultyForm = (overrides = {}) => ({
    department: 'Computer',
    designation: 'Assistant Professor',
    facultyId: 'FAC-01',
    phoneNumber: '9876543210',
    ...overrides,
});

const newUser = async (overrides = {}) => {
    const user = await createUser({ profileStatus: 'NotFilled', ...overrides });
    return { user, agent: await loginAgent(user) };
};

const admin = async () => loginAgent(await createAdmin());

beforeAll(async () => {
    // the unique roll number and faculty ID are database indexes
    await User.init();
});

beforeEach(() => {
    storeFile.mockClear();
});

describe('student profile', () => {
    test('saves the profile as waiting for approval', async () => {
        const { user, agent } = await newUser();

        const res = await agent.post(`${api}/student`).send(studentForm({
            gender: 'Female', dateOfBirth: '2004-05-17', hostelStatus: 'Hostel', admissionType: 'regular',
            emergencyContact: { name: 'Meena', relation: 'Mother', contact: '9000000000' },
        }));

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Profile submitted. An admin will review it.');
        const saved = await User.findById(user._id);
        expect(saved.role).toBe('student');
        expect(saved.profileStatus).toBe('Pending');
        expect(saved.rollNumber).toBe('CS-101');
        expect(saved.classDivision).toBe('A');
        expect(saved.gender).toBe('Female');
        expect(saved.dateOfBirth).toEqual(new Date('2004-05-17'));
        expect(saved.emergencyContact.name).toBe('Meena');
        expect(saved.idProof).toBeUndefined();
    });

    test('names the first required field that is missing', async () => {
        const { agent } = await newUser();

        const noRoll = await agent.post(`${api}/student`).send(studentForm({ rollNumber: '  ' }));
        const noDepartment = await agent.post(`${api}/student`).send(studentForm({ department: undefined }));

        expect(noRoll.status).toBe(400);
        expect(noRoll.body.message).toBe('Roll number is required');
        expect(noDepartment.body.message).toBe('Department is required');
    });

    test('refuses values outside the fixed choices and unreadable dates', async () => {
        const { user, agent } = await newUser();

        const gender = await agent.post(`${api}/student`).send(studentForm({ gender: 'Robot' }));
        const date = await agent.post(`${api}/student`).send(studentForm({ dateOfBirth: 'yesterday-ish' }));
        const object = await agent.post(`${api}/student`).send(studentForm({ department: { $ne: null } }));

        expect(gender.status).toBe(400);
        expect(gender.body.message).toBe('Gender must be one of: Male, Female, Other');
        expect(date.status).toBe(400);
        expect(date.body.message).toBe('Date of birth must be a date');
        expect(object.status).toBe(400);
        expect(object.body.message).toBe('Department must be text');
        expect((await User.findById(user._id)).profileStatus).toBe('NotFilled');
    });

    test('ignores role, status, duties and flags sent in the form', async () => {
        const { user, agent } = await newUser();

        await agent.post(`${api}/student`).send(studentForm({
            role: 'admin', profileStatus: 'Approved', isBoardMember: true, isDemo: true,
            coordinatorOf: { department: 'Computer', year: 'TE', division: 'A' }, email: 'other@test.dev', isVerified: false,
        }));

        const saved = await User.findById(user._id);
        expect(saved.role).toBe('student');
        expect(saved.profileStatus).toBe('Pending');
        expect(saved.isBoardMember).toBe(false);
        expect(saved.isDemo).toBe(false);
        expect(saved.coordinatorOf).toBeUndefined();
        expect(saved.email).toBe(user.email);
        expect(saved.isVerified).toBe(true);
    });

    test('stores an ID proof when one is attached, and reads the contact from a form field', async () => {
        const { user, agent } = await newUser();

        const res = await agent.post(`${api}/student`)
            .field('department', 'Computer').field('currentYear', 'TE').field('classDivision', 'A')
            .field('rollNumber', 'CS-102').field('phoneNumber', '9876543210')
            .field('emergencyContact', JSON.stringify({ name: 'Meena', relation: 'Mother', contact: '9000000000' }))
            .attach('idProof', Buffer.alloc(500), { filename: 'id.png', contentType: 'image/png' });

        expect(res.status).toBe(200);
        expect(storeFile).toHaveBeenCalledTimes(1);
        expect(storeFile.mock.calls[0][1]).toBe('profiles');
        const saved = await User.findById(user._id);
        expect(saved.idProof).toBe('https://files.example/id-proof.png');
        expect(saved.emergencyContact.relation).toBe('Mother');
    });

    test('a file of the wrong kind is refused and nothing is saved', async () => {
        const { user, agent } = await newUser();

        const res = await agent.post(`${api}/student`)
            .field('department', 'Computer').field('currentYear', 'TE').field('classDivision', 'A')
            .field('rollNumber', 'CS-103').field('phoneNumber', '9876543210')
            .attach('idProof', Buffer.alloc(500), { filename: 'id.exe', contentType: 'application/octet-stream' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Only images (JPEG, PNG, WebP) and PDF files are allowed');
        expect((await User.findById(user._id)).profileStatus).toBe('NotFilled');
    });

    test('a roll number that is already registered is refused', async () => {
        await createUser({ rollNumber: 'CS-101' });
        const { user, agent } = await newUser();

        const res = await agent.post(`${api}/student`).send(studentForm());

        expect(res.status).toBe(409);
        expect(res.body.message).toBe('This roll number is already registered');
        expect((await User.findById(user._id)).profileStatus).toBe('NotFilled');
    });

    test('two students sending the same roll number at the same moment: one is accepted', async () => {
        const first = await newUser();
        const second = await newUser();

        const answers = await Promise.all([
            first.agent.post(`${api}/student`).send(studentForm()),
            second.agent.post(`${api}/student`).send(studentForm()),
        ]);

        expect(answers.map((res) => res.status).sort()).toEqual([200, 409]);
        expect(await User.countDocuments({ rollNumber: 'CS-101' })).toBe(1);
    });

    test('cannot be sent again while pending or once approved', async () => {
        const pending = await newUser({ profileStatus: 'Pending' });
        const approved = await newUser({ profileStatus: 'Approved' });

        for (const { agent } of [pending, approved]) {
            const res = await agent.post(`${api}/student`).send(studentForm());
            expect(res.status).toBe(409);
            expect(res.body.message).toBe('Your profile has already been submitted');
        }
    });

    test('can be sent again after a rejection, which clears the old reason', async () => {
        const { user, agent } = await newUser({ profileStatus: 'Rejected', rejectionReason: 'Roll number missing' });

        const res = await agent.post(`${api}/student`).send(studentForm());

        expect(res.status).toBe(200);
        const saved = await User.findById(user._id);
        expect(saved.profileStatus).toBe('Pending');
        expect(saved.rejectionReason).toBeUndefined();
    });

    test('admin and doctor accounts have no profile to fill', async () => {
        for (const role of ['admin', 'doctor']) {
            const { agent } = await newUser({ role });
            const res = await agent.post(`${api}/student`).send(studentForm({ rollNumber: `R-${role}` }));
            expect(res.status).toBe(409);
        }
    });

    test('needs a login', async () => {
        const request = (await import('supertest')).default;
        expect((await request(app).post(`${api}/student`).send(studentForm())).status).toBe(401);
    });
});

describe('faculty profile', () => {
    test('saves the profile as faculty, waiting for approval', async () => {
        const { user, agent } = await newUser();

        const res = await agent.post(`${api}/faculty`).send(facultyForm({ qualification: 'M.Tech', joiningDate: '2019-07-01', isBoardMember: true }));

        expect(res.status).toBe(200);
        const saved = await User.findById(user._id);
        expect(saved.role).toBe('faculty');
        expect(saved.profileStatus).toBe('Pending');
        expect(saved.facultyId).toBe('FAC-01');
        expect(saved.designation).toBe('Assistant Professor');
        expect(saved.qualification).toBe('M.Tech');
        expect(saved.isBoardMember).toBe(false);
    });

    test('requires a known designation and a faculty ID', async () => {
        const { agent } = await newUser();

        const designation = await agent.post(`${api}/faculty`).send(facultyForm({ designation: 'Wizard' }));
        const facultyId = await agent.post(`${api}/faculty`).send(facultyForm({ facultyId: '' }));

        expect(designation.status).toBe(400);
        expect(designation.body.message).toContain('Designation must be one of: Professor');
        expect(facultyId.status).toBe(400);
        expect(facultyId.body.message).toBe('Faculty ID is required');
    });

    test('a faculty ID that is already registered is refused', async () => {
        await createUser({ role: 'faculty', facultyId: 'FAC-01' });
        const { agent } = await newUser();

        const res = await agent.post(`${api}/faculty`).send(facultyForm());

        expect(res.status).toBe(409);
        expect(res.body.message).toBe('This faculty ID is already registered');
    });
});

describe('decisions', () => {
    const pendingStudent = (overrides = {}) => createUser({ profileStatus: 'Pending', ...overrides });

    test('the pending list is for admins and is split by role', async () => {
        await pendingStudent({ name: 'Pending Student' });
        await createUser({ role: 'faculty', profileStatus: 'Pending', name: 'Pending Faculty' });
        await createUser({ name: 'Approved Student' });
        await createUser({ profileStatus: 'Rejected', name: 'Rejected Student' });

        const res = await (await admin()).get(`${api}/pending`);

        expect(res.status).toBe(200);
        expect(res.body.data.students.map((user) => user.name)).toEqual(['Pending Student']);
        expect(res.body.data.faculty.map((user) => user.name)).toEqual(['Pending Faculty']);
        expect(res.body.data.students[0]).not.toHaveProperty('password');
    });

    test('students, faculty and the doctor cannot see the list or decide', async () => {
        const target = await pendingStudent();

        for (const role of ['student', 'faculty', 'doctor']) {
            const agent = await loginAgent(await createUser({ role }));
            const answers = await Promise.all([
                agent.get(`${api}/pending`),
                agent.patch(`${api}/${target._id}/approve`),
                agent.patch(`${api}/${target._id}/reject`).send({ reason: 'No' }),
                agent.patch(`${api}/${target._id}/duties`).send({ isBoardMember: true }),
            ]);

            for (const res of answers) {
                expect(res.status).toBe(403);
                expect(res.body.message).toBe('You are not allowed to do this');
            }
        }
        expect((await User.findById(target._id)).profileStatus).toBe('Pending');
    });

    test('approving lets the user in and tells them', async () => {
        const target = await pendingStudent();

        const res = await (await admin()).patch(`${api}/${target._id}/approve`);

        expect(res.status).toBe(200);
        expect((await User.findById(target._id)).profileStatus).toBe('Approved');
        const [notice] = await Notice.find({ user: target._id });
        expect(notice.title).toBe('Your profile was approved');
        expect(notice.type).toBe('profile');
    });

    test('rejecting needs a reason, stores it and tells the user', async () => {
        const target = await pendingStudent();
        const agent = await admin();

        const noReason = await agent.patch(`${api}/${target._id}/reject`).send({ reason: '   ' });
        const rejected = await agent.patch(`${api}/${target._id}/reject`).send({ reason: 'The ID proof is not readable' });

        expect(noReason.status).toBe(400);
        expect(noReason.body.message).toBe('A reason is required');
        expect(rejected.status).toBe(200);
        const saved = await User.findById(target._id);
        expect(saved.profileStatus).toBe('Rejected');
        expect(saved.rejectionReason).toBe('The ID proof is not readable');
        const [notice] = await Notice.find({ user: target._id });
        expect(notice.title).toBe('Your profile was rejected');
        expect(notice.body).toBe('The ID proof is not readable');
    });

    test('only a pending profile can be decided', async () => {
        const agent = await admin();

        for (const profileStatus of ['NotFilled', 'Approved', 'Rejected']) {
            const target = await createUser({ profileStatus });
            const approve = await agent.patch(`${api}/${target._id}/approve`);
            const reject = await agent.patch(`${api}/${target._id}/reject`).send({ reason: 'No' });

            expect(approve.status).toBe(409);
            expect(approve.body.message).toBe('This profile is not waiting for a decision');
            expect(reject.status).toBe(409);
            expect((await User.findById(target._id)).profileStatus).toBe(profileStatus);
        }
        expect(await Notice.countDocuments()).toBe(0);
    });

    test('an unknown user and a malformed id are 404', async () => {
        const agent = await admin();

        for (const id of ['507f1f77bcf86cd799439011', 'not-an-id']) {
            for (const res of [await agent.patch(`${api}/${id}/approve`), await agent.patch(`${api}/${id}/reject`).send({ reason: 'No' }), await agent.patch(`${api}/${id}/duties`).send({ isBoardMember: true })]) {
                expect(res.status).toBe(404);
                expect(res.body.message).toBe('User not found');
            }
        }
    });
});

describe('approved faculty list', () => {
    test('lists approved faculty with their duties, for admins only', async () => {
        await createUser({ role: 'faculty', name: 'Zara Approved', isBoardMember: true, coordinatorOf: { department: 'IT', year: 'SE', division: 'B' } });
        await createUser({ role: 'faculty', name: 'Amit Approved' });
        await createUser({ role: 'faculty', name: 'Pending Faculty', profileStatus: 'Pending' });
        await createUser({ name: 'A Student' });

        const res = await (await admin()).get(`${api}/faculty`);
        const asFaculty = await (await loginAgent(await createUser({ role: 'faculty' }))).get(`${api}/faculty`);

        expect(res.status).toBe(200);
        expect(res.body.data.faculty.map((member) => member.name)).toEqual(['Amit Approved', 'Zara Approved']);
        expect(res.body.data.faculty[1].isBoardMember).toBe(true);
        expect(res.body.data.faculty[1].coordinatorOf).toEqual({ department: 'IT', year: 'SE', division: 'B' });
        expect(res.body.data.faculty[0]).not.toHaveProperty('password');
        expect(asFaculty.status).toBe(403);
    });
});

describe('duties', () => {
    test('an admin makes a faculty member a board member and a class coordinator', async () => {
        const faculty = await createUser({ role: 'faculty' });
        const agent = await admin();

        const res = await agent.patch(`${api}/${faculty._id}/duties`).send({
            isBoardMember: true,
            coordinatorOf: { department: 'Computer', year: 'TE', division: 'A' },
        });

        expect(res.status).toBe(200);
        const saved = await User.findById(faculty._id);
        expect(saved.isBoardMember).toBe(true);
        expect(saved.coordinatorOf.toObject()).toEqual({ department: 'Computer', year: 'TE', division: 'A' });
    });

    test('sending one duty leaves the other as it was, and null removes the class', async () => {
        const faculty = await createUser({ role: 'faculty', isBoardMember: true, coordinatorOf: { department: 'IT', year: 'SE', division: 'B' } });
        const agent = await admin();

        await agent.patch(`${api}/${faculty._id}/duties`).send({ isBoardMember: false });
        expect((await User.findById(faculty._id)).coordinatorOf.division).toBe('B');

        await agent.patch(`${api}/${faculty._id}/duties`).send({ coordinatorOf: null });
        const saved = await User.findById(faculty._id);
        expect(saved.isBoardMember).toBe(false);
        expect(saved.coordinatorOf).toBeUndefined();
    });

    test('duties go only to faculty, and need a whole class', async () => {
        const student = await createUser();
        const faculty = await createUser({ role: 'faculty' });
        const agent = await admin();

        const toStudent = await agent.patch(`${api}/${student._id}/duties`).send({ isBoardMember: true });
        const halfClass = await agent.patch(`${api}/${faculty._id}/duties`).send({ coordinatorOf: { department: 'Computer' } });
        const notBoolean = await agent.patch(`${api}/${faculty._id}/duties`).send({ isBoardMember: 'yes' });

        expect(toStudent.status).toBe(400);
        expect(toStudent.body.message).toBe('Duties can only be given to faculty');
        expect(halfClass.status).toBe(400);
        expect(halfClass.body.message).toBe('Department, year and division are required for a coordinator');
        expect(notBoolean.status).toBe(400);
        expect((await User.findById(student._id)).isBoardMember).toBe(false);
    });
});

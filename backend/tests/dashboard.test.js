import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Notice } from '../src/models/notice.model.js';
import { notify } from '../src/utils/notices.js';
import { DEMO_LOGINS, DEMO_PASSWORD, ensureAdmin, ensureDoctor, rebuildSampleCollege } from '../src/scripts/sampleCollege.js';
import { Election } from '../src/models/election.model.js';
import { Candidate } from '../src/models/candidate.model.js';
import { Vote } from '../src/models/vote.model.js';
import { Complaint } from '../src/models/complaint.model.js';
import { Facility } from '../src/models/facility.model.js';
import { Booking } from '../src/models/booking.model.js';
import { Application } from '../src/models/application.model.js';
import { Budget } from '../src/models/budget.model.js';
import { IntegrityRecord } from '../src/models/integrityRecord.model.js';
import { HealthConcern } from '../src/models/healthConcern.model.js';
import { stageOf } from '../src/utils/electionStage.js';
import { collegeDayFromNow } from '../src/utils/collegeTime.js';
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
        expect(cardsOf(res)).toMatchObject({ pendingProfiles: 2, students: 2, faculty: 1, unreadNotices: 0 });
        expect(res.body.data.cards[0]).toEqual({ key: 'pendingProfiles', label: 'Profiles waiting for approval', value: 2, link: '/pending-request' });
    });

    test('a student sees their unread notices and no admin figures', async () => {
        const user = await createUser();
        await notify(user._id, { type: 'profile', title: 'Your profile was approved' });
        await Notice.create({ user: user._id, type: 'a', title: 'Already read', readAt: new Date() });

        const res = await (await loginAgent(user)).get(api);

        expect(res.body.data.role).toBe('student');
        expect(res.body.data.unreadNotices).toBe(1);
        expect(cardsOf(res)).toMatchObject({ unreadNotices: 1 });
        expect(cardsOf(res)).not.toHaveProperty('pendingProfiles');
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

describe('ensureDoctor', () => {
    afterEach(() => {
        delete process.env.DOCTOR_EMAIL;
        delete process.env.DOCTOR_PASSWORD;
    });

    test('creates the college doctor once from the settings, able to use the system', async () => {
        process.env.DOCTOR_EMAIL = 'Doctor@College.edu';
        process.env.DOCTOR_PASSWORD = 'doctor-secret';

        expect(await ensureDoctor()).toBe(true);
        expect(await ensureDoctor()).toBe(false);

        const agent = request.agent(app);
        const res = await agent.post('/api/v1/users/login').send({ email: 'doctor@college.edu', password: 'doctor-secret' });
        expect(res.status).toBe(200);
        expect(res.body.data.user.role).toBe('doctor');
        expect(res.body.data.user.isDemo).toBe(false);
        expect((await agent.get('/api/v1/health-concerns')).status).toBe(200);
        expect(await User.countDocuments({ role: 'doctor' })).toBe(1);
    });

    test('does nothing without both settings', async () => {
        process.env.DOCTOR_PASSWORD = 'doctor-secret';

        expect(await ensureDoctor()).toBe(false);
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

        expect(cardsOf(res)).toMatchObject({ pendingProfiles: 1, students: 1, faculty: 1, unreadNotices: 0 });
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

describe('module figures', () => {
    const DAY = 24 * 60 * 60 * 1000;
    const fromNow = (ms) => new Date(Date.now() + ms);
    const tomorrow = collegeDayFromNow(1);

    const voting = (overrides = {}) => Election.create({ title: 'Open', applicationDeadline: fromNow(-DAY), votingDay: new Date(collegeDayFromNow(0)), ...overrides });
    const hall = () => Facility.create({ name: 'Hall', description: 'd', location: 'l' });
    const bookingOf = async (user, overrides = {}) => Booking.create({ facility: (await hall())._id, user: user._id, date: tomorrow, startTime: '10:00', endTime: '11:00', purpose: 'p', ...overrides });
    const applicationOf = (user, overrides = {}) => Application.create({ title: 't', description: 'd', category: 'event', submittedBy: user._id, ...overrides });
    const complaintOf = (user, overrides = {}) => Complaint.create({ title: 't', description: 'd', author: user._id, ...overrides });

    test('a student sees elections they can still vote in and their own pending requests', async () => {
        const me = await createUser({ department: 'Computer', currentYear: 'TE', classDivision: 'A' });
        const other = await createUser();
        const voted = await voting();
        await Vote.create({ election: voted._id, voter: me._id, candidate: (await Candidate.create({ election: voted._id, student: other._id, agenda: 'a', status: 'Approved' }))._id });
        await voting();
        await voting({ eligibility: { department: 'IT' } });
        await Election.create({ title: 'Applying', applicationDeadline: fromNow(DAY), votingDay: fromNow(3 * DAY) });
        await bookingOf(me);
        await bookingOf(me, { status: 'approved' });
        await bookingOf(other);
        await applicationOf(me);
        await applicationOf(me, { status: 'rejected' });

        const res = await (await loginAgent(me)).get(api);

        expect(cardsOf(res)).toEqual({ openElections: 1, myPendingBookings: 1, myPendingApplications: 1, myOpenConcerns: 0, unreadNotices: 0 });
    });

    test('a faculty member sees applications waiting for a review; a board member also sees reveal votes waiting', async () => {
        const student = await createUser();
        const plain = await createUser({ role: 'faculty' });
        const board = await createUser({ role: 'faculty', isBoardMember: true });
        await applicationOf(student);
        await applicationOf(student, { review: { comment: 'ok', by: plain._id, at: new Date() } });
        await applicationOf(student, { status: 'approved' });
        await complaintOf(student, { isAnonymous: true });
        await complaintOf(student, { isAnonymous: true, revealVotes: [board._id] });
        await complaintOf(student, { isAnonymous: true, revealedAt: new Date() });
        await complaintOf(student);
        await bookingOf(plain);

        const forPlain = cardsOf(await (await loginAgent(plain)).get(api));
        const forBoard = cardsOf(await (await loginAgent(board)).get(api));

        expect(forPlain).toEqual({ applicationsToReview: 1, myPendingBookings: 1, unreadNotices: 0 });
        expect(forBoard).toEqual({ applicationsToReview: 1, myPendingBookings: 0, complaintsToReveal: 1, unreadNotices: 0 });
    });

    test('an admin sees what is waiting for a decision in every module', async () => {
        const student = await createUser();
        const election = await Election.create({ title: 'Applying', applicationDeadline: fromNow(DAY), votingDay: fromNow(3 * DAY) });
        await Candidate.create({ election: election._id, student: student._id, agenda: 'a' });
        await Candidate.create({ election: election._id, student: (await createUser())._id, agenda: 'a', status: 'Approved' });
        await bookingOf(student);
        await bookingOf(student);
        await bookingOf(student, { status: 'rejected' });
        await applicationOf(student);
        await complaintOf(student);
        await complaintOf(student, { status: 'resolved' });

        const cards = cardsOf(await (await loginAgent(await createAdmin())).get(api));

        expect(cards).toMatchObject({ pendingCandidates: 1, pendingBookings: 2, pendingApplications: 1, openComplaints: 1 });
    });

    test('the demo admin and demo faculty count sample data only', async () => {
        const realStudent = await createUser();
        const demoStudent = await createUser({ isDemo: true });
        await bookingOf(realStudent);
        await bookingOf(demoStudent, { isDemo: true });
        await applicationOf(realStudent);
        await applicationOf(demoStudent, { isDemo: true });
        await complaintOf(realStudent, { isAnonymous: true });
        await complaintOf(demoStudent, { isDemo: true, isAnonymous: true });

        const forAdmin = cardsOf(await (await loginAgent(await createAdmin({ isDemo: true }))).get(api));
        const forBoard = cardsOf(await (await loginAgent(await createUser({ role: 'faculty', isBoardMember: true, isDemo: true }))).get(api));

        expect(forAdmin).toMatchObject({ pendingBookings: 1, pendingApplications: 1, openComplaints: 1 });
        expect(forBoard).toMatchObject({ applicationsToReview: 1, complaintsToReveal: 1 });
    });

    const budgetOf = (user, overrides = {}) => Budget.create({ title: 't', category: 'event', description: 'd', requestedAmount: 100, requestedBy: user._id, ...overrides });
    const concernOf = (user, overrides = {}) => HealthConcern.create({ student: user._id, symptoms: 's', ...overrides });
    const leaveOf = (user, from, until, overrides = {}) => concernOf(user, {
        status: 'assessed', assessment: { diagnosis: 'd', leaveDays: 3, at: new Date() },
        leaveFrom: collegeDayFromNow(from), leaveUntil: collegeDayFromNow(until), ...overrides,
    });

    test('an admin sees budget requests waiting; the demo admin counts sample ones only', async () => {
        const student = await createUser();
        await budgetOf(student);
        await budgetOf(student, { isDemo: true });
        await budgetOf(student, { status: 'approved', approvedAmount: 50 });

        expect(cardsOf(await (await loginAgent(await createAdmin())).get(api)).pendingBudgets).toBe(2);
        expect(cardsOf(await (await loginAgent(await createAdmin({ isDemo: true }))).get(api)).pendingBudgets).toBe(1);
    });

    test('the doctor sees how many concerns are open and how many of them are urgent', async () => {
        const student = await createUser();
        await concernOf(student);
        await concernOf(student, { urgency: 'urgent' });
        await concernOf(student, { urgency: 'urgent', status: 'assessed' });
        await concernOf(student, { urgency: 'urgent', isDemo: true });

        const real = cardsOf(await (await loginAgent(await createUser({ role: 'doctor' }))).get(api));
        const demo = cardsOf(await (await loginAgent(await createUser({ role: 'doctor', isDemo: true }))).get(api));

        expect(real).toEqual({ openConcerns: 3, urgentConcerns: 2, unreadNotices: 0 });
        expect(demo).toEqual({ openConcerns: 1, urgentConcerns: 1, unreadNotices: 0 });
    });

    test('a student sees their own open concerns', async () => {
        const me = await createUser();
        await concernOf(me);
        await concernOf(me, { status: 'assessed' });
        await concernOf(await createUser());

        expect(cardsOf(await (await loginAgent(me)).get(api)).myOpenConcerns).toBe(1);
    });

    test('a coordinator sees how many students of the class are on leave today', async () => {
        const inClass = { department: 'Computer', currentYear: 'TE', classDivision: 'A' };
        const guide = await createUser({ role: 'faculty', coordinatorOf: { department: 'Computer', year: 'TE', division: 'A' } });
        const away = await createUser(inClass);
        await leaveOf(away, -1, 1);
        await leaveOf(away, 0, 0);
        await leaveOf(await createUser(inClass), -5, -1);
        await leaveOf(await createUser(inClass), 1, 3);
        await leaveOf(await createUser({ ...inClass, classDivision: 'B' }), -1, 1);
        await leaveOf(await createUser({ ...inClass, isDemo: true }), -1, 1, { isDemo: true });

        const forGuide = cardsOf(await (await loginAgent(guide)).get(api));
        const forDemoGuide = cardsOf(await (await loginAgent(await createUser({ role: 'faculty', isDemo: true, coordinatorOf: { department: 'Computer', year: 'TE', division: 'A' } }))).get(api));
        const forPlain = cardsOf(await (await loginAgent(await createUser({ role: 'faculty' }))).get(api));

        expect(forGuide.studentsOnLeave).toBe(2);
        expect(forDemoGuide.studentsOnLeave).toBe(1);
        expect(forPlain).not.toHaveProperty('studentsOnLeave');
    });

    test('every card has a label and a link into the app', async () => {
        const res = await (await loginAgent(await createAdmin())).get(api);
        for (const card of res.body.data.cards) {
            expect(typeof card.label).toBe('string');
            expect(card.link).toMatch(/^\//);
        }
    });
});

describe('sample data of the modules', () => {
    const counts = async () => ({
        elections: await Election.countDocuments(),
        candidates: await Candidate.countDocuments(),
        votes: await Vote.countDocuments(),
        complaints: await Complaint.countDocuments(),
        facilities: await Facility.countDocuments(),
        bookings: await Booking.countDocuments(),
        applications: await Application.countDocuments(),
        budgets: await Budget.countDocuments(),
        records: await IntegrityRecord.countDocuments(),
        concerns: await HealthConcern.countDocuments(),
    });

    test('the last modules have sample content in different states', async () => {
        await rebuildSampleCollege();

        expect(await Budget.countDocuments({ isDemo: true })).toBe(5);
        expect((await Budget.distinct('status')).sort()).toEqual(['approved', 'pending', 'rejected']);
        expect(await IntegrityRecord.countDocuments({ isDemo: true })).toBe(2);
        expect(await HealthConcern.countDocuments({ isDemo: true })).toBe(4);
        expect(await HealthConcern.countDocuments({ status: 'open', urgency: 'urgent' })).toBe(1);
        expect(await HealthConcern.countDocuments({ status: 'open', urgency: 'normal' })).toBe(1);
        expect(await HealthConcern.countDocuments({ status: 'assessed' })).toBe(2);
    });

    test('every demo login has something to see in the last modules', async () => {
        await rebuildSampleCollege();
        const login = async (role) => loginAgent(await User.findOne({ email: DEMO_LOGINS[role] }), DEMO_PASSWORD);

        expect(cardsOf(await (await login('admin')).get(api)).pendingBudgets).toBeGreaterThan(0);
        expect(cardsOf(await (await login('doctor')).get(api))).toMatchObject({ openConcerns: 2, urgentConcerns: 1 });
        expect(cardsOf(await (await login('student')).get(api)).myOpenConcerns).toBe(1);
        // the demo faculty member coordinates the demo student's class, where someone is on leave today
        expect(cardsOf(await (await login('faculty')).get(api)).studentsOnLeave).toBe(1);
        expect((await (await login('faculty')).get('/api/v1/leaves')).body.data.leaves).toHaveLength(1);
    });

    test('real budgets, records and concerns are kept by a rebuild', async () => {
        await rebuildSampleCollege();
        const real = await createUser({ email: 'kept.person@gmail.com', rollNumber: 'REAL-77' });
        await Budget.create({ title: 'Real budget', category: 'event', description: 'd', requestedAmount: 10, requestedBy: real._id });
        await IntegrityRecord.create({ student: real._id, studentName: real.name, rollNumber: 'REAL-77', reason: 'r' });
        await HealthConcern.create({ student: real._id, symptoms: 'Real concern' });
        const before = await counts();

        await rebuildSampleCollege();

        expect(await counts()).toEqual(before);
        expect(await Budget.countDocuments({ title: 'Real budget' })).toBe(1);
        expect(await IntegrityRecord.countDocuments({ rollNumber: 'REAL-77' })).toBe(1);
        expect(await HealthConcern.countDocuments({ symptoms: 'Real concern' })).toBe(1);
    });

    test('there is an election at every stage, with a winner in the closed one', async () => {
        await rebuildSampleCollege();

        const elections = await Election.find();
        expect(elections.map((election) => stageOf(election)).sort()).toEqual(['applications', 'closed', 'voting']);
        expect(elections.every((election) => election.isDemo)).toBe(true);

        const student = await loginAgent(await User.findOne({ email: DEMO_LOGINS.student }), DEMO_PASSWORD);
        const closed = elections.find((election) => stageOf(election) === 'closed');
        const open = elections.find((election) => stageOf(election) === 'voting');
        const closedView = (await student.get(`/api/v1/elections/${closed._id}`)).body.data;
        const openView = (await student.get(`/api/v1/elections/${open._id}`)).body.data;

        expect(closedView.winners).toHaveLength(1);
        expect(openView.candidates.length).toBeGreaterThanOrEqual(3);
        expect(openView.eligible).toBe(true);
        expect(openView.hasVoted).toBe(false);
        // the counts shown match the votes that exist
        const shown = openView.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
        expect(shown).toBe(await Vote.countDocuments({ election: open._id }));
    });

    test('every module has sample content in different states', async () => {
        await rebuildSampleCollege();

        expect(await Complaint.countDocuments({ isDemo: true })).toBe(6);
        expect(await Complaint.countDocuments({ isAnonymous: true })).toBe(2);
        expect(await Complaint.countDocuments({ status: 'resolved' })).toBe(1);
        expect(await Facility.countDocuments({ isDemo: true })).toBe(4);
        expect((await Booking.distinct('status')).sort()).toEqual(['approved', 'pending', 'rejected']);
        expect(await Booking.countDocuments({ isDemo: true })).toBe(6);
        expect((await Application.distinct('status')).sort()).toEqual(['approved', 'pending', 'rejected']);
        expect(await Application.countDocuments({ isDemo: true })).toBe(6);
    });

    test('the demo student has something to do in each module', async () => {
        await rebuildSampleCollege();
        const student = await loginAgent(await User.findOne({ email: DEMO_LOGINS.student }), DEMO_PASSWORD);
        const admin = await loginAgent(await User.findOne({ email: DEMO_LOGINS.admin }), DEMO_PASSWORD);

        expect(cardsOf(await student.get(api)).openElections).toBe(1);
        const adminCards = cardsOf(await admin.get(api));
        expect(adminCards.pendingBookings).toBeGreaterThan(0);
        expect(adminCards.pendingApplications).toBeGreaterThan(0);
        expect(adminCards.pendingCandidates).toBeGreaterThan(0);
        expect(adminCards.openComplaints).toBeGreaterThan(0);
    });

    test('running it again gives the same content, not more', async () => {
        await rebuildSampleCollege();
        const first = await counts();

        await rebuildSampleCollege();

        expect(await counts()).toEqual(first);
        expect(first.elections).toBe(3);
    });

    test('what real users made is kept; what they did to sample data goes with it', async () => {
        await rebuildSampleCollege();
        const real = await createUser({ email: 'real.person@gmail.com' });
        const realElection = await Election.create({ title: 'Real election', applicationDeadline: new Date(Date.now() - 1000), votingDay: new Date(collegeDayFromNow(0)) });
        const realCandidate = await Candidate.create({ election: realElection._id, student: real._id, agenda: 'a', status: 'Approved' });
        await Vote.create({ election: realElection._id, voter: real._id, candidate: realCandidate._id });
        await Complaint.create({ title: 'Real complaint', description: 'd', author: real._id });
        const realHall = await Facility.create({ name: 'Real hall', description: 'd', location: 'l' });
        await Booking.create({ facility: realHall._id, user: real._id, date: '2030-01-01', startTime: '10:00', endTime: '11:00', purpose: 'p' });
        await Application.create({ title: 'Real application', description: 'd', category: 'event', submittedBy: real._id });
        // the real user votes in the sample election and books a sample facility
        const sampleElection = (await Election.find({ isDemo: true })).find((election) => stageOf(election) === 'voting');
        const sampleCandidate = await Candidate.findOne({ election: sampleElection._id, status: 'Approved' });
        await Vote.create({ election: sampleElection._id, voter: real._id, candidate: sampleCandidate._id });
        const sampleHall = await Facility.findOne({ isDemo: true });
        await Booking.create({ facility: sampleHall._id, user: real._id, date: '2030-01-01', startTime: '10:00', endTime: '11:00', purpose: 'p', isDemo: true });
        const before = await counts();

        await rebuildSampleCollege();

        expect(await Election.countDocuments({ title: 'Real election' })).toBe(1);
        expect(await Candidate.countDocuments({ _id: realCandidate._id })).toBe(1);
        expect(await Vote.countDocuments({ election: realElection._id })).toBe(1);
        expect(await Complaint.countDocuments({ title: 'Real complaint' })).toBe(1);
        expect(await Facility.countDocuments({ name: 'Real hall' })).toBe(1);
        expect(await Booking.countDocuments({ facility: realHall._id })).toBe(1);
        expect(await Application.countDocuments({ title: 'Real application' })).toBe(1);
        // the vote and the booking on sample data are gone, and nothing points at removed documents
        expect(await Vote.countDocuments({ voter: real._id })).toBe(1);
        expect(await Booking.countDocuments({ user: real._id })).toBe(1);
        expect(await counts()).toEqual({ ...before, votes: before.votes - 1, bookings: before.bookings - 1 });
    });
});

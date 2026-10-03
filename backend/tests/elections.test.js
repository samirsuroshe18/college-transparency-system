import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import { Election } from '../src/models/election.model.js';
import { Candidate } from '../src/models/candidate.model.js';
import { Vote } from '../src/models/vote.model.js';
import { Notice } from '../src/models/notice.model.js';
import { stageOf, isEligible } from '../src/utils/electionStage.js';
import { createUser, createAdmin, loginAgent } from './helpers.js';

const api = '/api/v1/elections';
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const fromNow = (ms) => new Date(Date.now() + ms);

const student = (overrides = {}) => createUser({ department: 'Computer', currentYear: 'TE', classDivision: 'A', ...overrides });

// elections at each stage, made directly so the dates can be in the past
const election = (overrides = {}) => Election.create({ title: 'Class representative', applicationDeadline: fromNow(DAY), votingDay: fromNow(3 * DAY), ...overrides });
const takingApplications = (overrides) => election(overrides);
const openForVoting = (overrides) => election({ applicationDeadline: fromNow(-DAY), votingDay: fromNow(0), ...overrides });
const closed = (overrides) => election({ applicationDeadline: fromNow(-5 * DAY), votingDay: fromNow(-2 * DAY), ...overrides });

// "votes: n" casts n votes for the candidate, each from a voter of its own
const candidate = async (electionDoc, { votes = 0, ...overrides } = {}) => {
    const user = overrides.student || await student();
    const created = await Candidate.create({ election: electionDoc._id, agenda: 'Better labs', status: 'Approved', ...overrides, student: user._id });

    for (let i = 0; i < votes; i += 1) {
        await Vote.create({ election: electionDoc._id, voter: new mongoose.Types.ObjectId(), candidate: created._id });
    }

    return created;
};

const votesFor = (created) => Vote.countDocuments({ candidate: created._id });

const as = async (user) => loginAgent(user);
const asAdmin = async (overrides) => loginAgent(await createAdmin(overrides));

beforeAll(async () => {
    // one vote and one candidacy per student are database indexes
    await Promise.all([Candidate.init(), Vote.init()]);
});

describe('stageOf', () => {
    const base = { applicationDeadline: new Date('2026-11-10T12:00:00Z'), votingDay: new Date('2026-11-12T00:00:00Z') };

    test('applications until the deadline, voting to the end of the voting day, then closed', () => {
        expect(stageOf(base, new Date('2026-11-10T11:59:59Z'))).toBe('applications');
        expect(stageOf(base, new Date('2026-11-10T12:00:00Z'))).toBe('voting');
        expect(stageOf(base, new Date('2026-11-12T23:59:59.999Z'))).toBe('voting');
        expect(stageOf(base, new Date('2026-11-13T00:00:00Z'))).toBe('closed');
    });

    test('an election that was ended is closed at once', () => {
        expect(stageOf({ ...base, endedAt: new Date('2026-11-11T00:00:00Z') }, new Date('2026-11-11T08:00:00Z'))).toBe('closed');
    });
});

describe('isEligible', () => {
    const voter = { role: 'student', department: 'Computer', currentYear: 'TE', classDivision: 'A' };

    test('an election without rules is open to every student', () => {
        expect(isEligible({ eligibility: {} }, voter)).toBe(true);
        expect(isEligible({}, voter)).toBe(true);
    });

    test('every rule that is set must match', () => {
        expect(isEligible({ eligibility: { department: 'Computer', year: 'TE', division: 'A' } }, voter)).toBe(true);
        expect(isEligible({ eligibility: { department: 'Computer', year: 'TE', division: 'B' } }, voter)).toBe(false);
        expect(isEligible({ eligibility: { department: 'IT' } }, voter)).toBe(false);
        expect(isEligible({ eligibility: { year: 'TE' } }, voter)).toBe(true);
    });

    test('only students are eligible', () => {
        expect(isEligible({ eligibility: {} }, { ...voter, role: 'faculty' })).toBe(false);
    });
});

describe('access', () => {
    test('every route needs a login and an approved profile', async () => {
        const id = '507f1f77bcf86cd799439011';
        const pending = await as(await student({ profileStatus: 'Pending' }));

        expect((await request(app).get(api)).status).toBe(401);
        for (const res of [await pending.get(api), await pending.get(`${api}/${id}`), await pending.post(`${api}/${id}/vote`).send({})]) {
            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Your profile is waiting for approval');
        }
    });

    test('creating, ending and deciding candidates are for admins', async () => {
        const target = await takingApplications();
        const applicant = await candidate(target, { status: 'Pending' });

        for (const role of ['student', 'faculty', 'doctor']) {
            const agent = await as(await createUser({ role }));
            const answers = [
                await agent.post(api).send({ title: 'x' }),
                await agent.patch(`${api}/${target._id}/end`),
                await agent.patch(`${api}/${target._id}/candidates/${applicant._id}`).send({ status: 'Approved' }),
            ];
            for (const res of answers) {
                expect(res.status).toBe(403);
                expect(res.body.message).toBe('You are not allowed to do this');
            }
        }
    });
});

describe('creating an election', () => {
    const form = (overrides = {}) => ({
        title: 'General secretary',
        description: 'For the academic year',
        applicationDeadline: fromNow(2 * DAY).toISOString(),
        votingDay: fromNow(5 * DAY).toISOString(),
        eligibility: { department: 'Computer', year: 'TE' },
        ...overrides,
    });

    test('an admin creates one; it starts by taking applications', async () => {
        const admin = await createAdmin();

        const res = await (await as(admin)).post(api).send(form());

        expect(res.status).toBe(201);
        expect(res.body.data.election.stage).toBe('applications');
        const saved = await Election.findById(res.body.data.election._id);
        expect(saved.title).toBe('General secretary');
        expect(saved.eligibility.toObject()).toEqual({ department: 'Computer', year: 'TE' });
        expect(String(saved.createdBy)).toBe(String(admin._id));
        expect(saved.isDemo).toBe(false);
    });

    test('an election made by the demo admin is sample data', async () => {
        const res = await (await asAdmin({ isDemo: true })).post(api).send(form());
        expect((await Election.findById(res.body.data.election._id)).isDemo).toBe(true);
    });

    test('needs a title and both dates', async () => {
        const agent = await asAdmin();

        expect((await agent.post(api).send(form({ title: ' ' }))).body.message).toBe('Title is required');
        expect((await agent.post(api).send(form({ applicationDeadline: undefined }))).body.message).toBe('Application deadline is required');
        expect((await agent.post(api).send(form({ votingDay: 'someday' }))).body.message).toBe('Voting day must be a date');
        expect(await Election.countDocuments()).toBe(0);
    });

    test('the deadline must be before the voting day, and the voting day not in the past', async () => {
        const agent = await asAdmin();

        const wrongOrder = await agent.post(api).send(form({ applicationDeadline: fromNow(6 * DAY).toISOString() }));
        const past = await agent.post(api).send(form({ applicationDeadline: fromNow(-4 * DAY).toISOString(), votingDay: fromNow(-2 * DAY).toISOString() }));

        expect(wrongOrder.status).toBe(400);
        expect(wrongOrder.body.message).toBe('The application deadline must be before the voting day');
        expect(past.status).toBe(400);
        expect(past.body.message).toBe('The voting day cannot be in the past');
    });

    test('eligibility that is not plain text is refused', async () => {
        const res = await (await asAdmin()).post(api).send(form({ eligibility: { department: { $ne: null } } }));
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Department must be text');
    });
});

describe('reading elections', () => {
    test('the list gives each election its stage and number of approved candidates', async () => {
        const open = await openForVoting({ title: 'Open' });
        await candidate(open);
        await candidate(open);
        await candidate(open, { status: 'Pending' });
        await takingApplications({ title: 'Applying' });
        await closed({ title: 'Closed' });

        const res = await (await as(await student())).get(api);

        expect(res.status).toBe(200);
        const byTitle = Object.fromEntries(res.body.data.elections.map((item) => [item.title, item]));
        expect(byTitle.Open.stage).toBe('voting');
        expect(byTitle.Open.candidateCount).toBe(2);
        expect(byTitle.Applying.stage).toBe('applications');
        expect(byTitle.Closed.stage).toBe('closed');
    });

    test('one election shows approved candidates to students and all of them to admins', async () => {
        const target = await takingApplications();
        await candidate(target, { status: 'Approved', agenda: 'Approved agenda' });
        await candidate(target, { status: 'Pending', agenda: 'Pending agenda' });
        await candidate(target, { status: 'Rejected', agenda: 'Rejected agenda' });

        const forStudent = await (await as(await student())).get(`${api}/${target._id}`);
        const forAdmin = await (await asAdmin()).get(`${api}/${target._id}`);

        expect(forStudent.body.data.candidates.map((item) => item.agenda)).toEqual(['Approved agenda']);
        expect(forAdmin.body.data.candidates.map((item) => item.status).sort()).toEqual(['Approved', 'Pending', 'Rejected']);
        expect(forStudent.body.data.candidates[0].student.name).toBe('Test User');
        expect(forStudent.body.data.candidates[0].student).not.toHaveProperty('email');
    });

    test('a student sees their own application, whatever its status', async () => {
        const me = await student();
        const target = await takingApplications();
        await candidate(target, { student: me, status: 'Pending', agenda: 'My agenda' });

        const res = await (await as(me)).get(`${api}/${target._id}`);

        expect(res.body.data.myCandidacy.status).toBe('Pending');
        expect(res.body.data.myCandidacy.agenda).toBe('My agenda');
        expect(res.body.data.candidates).toEqual([]);
    });

    test('vote counts are hidden while applications are open and shown from voting on', async () => {
        const applying = await takingApplications();
        await candidate(applying, { votes: 5 });
        const voting = await openForVoting();
        await candidate(voting, { votes: 5 });
        const agent = await as(await student());

        expect((await agent.get(`${api}/${applying._id}`)).body.data.candidates[0].votes).toBe(0);
        expect((await agent.get(`${api}/${voting._id}`)).body.data.candidates[0].votes).toBe(5);
    });

    test('says whether the caller is eligible and has voted', async () => {
        const target = await openForVoting({ eligibility: { department: 'Computer' } });
        const runner = await candidate(target);
        const voter = await student();
        const outsider = await student({ department: 'IT' });
        await Vote.create({ election: target._id, voter: voter._id, candidate: runner._id });

        const mine = (await (await as(voter)).get(`${api}/${target._id}`)).body.data;
        const theirs = (await (await as(outsider)).get(`${api}/${target._id}`)).body.data;

        expect(mine.eligible).toBe(true);
        expect(mine.hasVoted).toBe(true);
        expect(theirs.eligible).toBe(false);
        expect(theirs.hasVoted).toBe(false);
    });

    test('an unknown or malformed id is 404', async () => {
        const agent = await as(await student());
        for (const id of ['507f1f77bcf86cd799439011', 'not-an-id']) {
            const res = await agent.get(`${api}/${id}`);
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Election not found');
        }
    });
});

describe('applying as a candidate', () => {
    const apply = (agent, id, body = { agenda: 'Cleaner hostel', experience: 'Class monitor' }) => agent.post(`${api}/${id}/candidates`).send(body);

    test('an eligible student applies and waits for approval', async () => {
        const me = await student();
        const target = await takingApplications();

        const res = await apply(await as(me), target._id);

        expect(res.status).toBe(201);
        const saved = await Candidate.findOne({ election: target._id, student: me._id });
        expect(saved.status).toBe('Pending');
        expect(saved.agenda).toBe('Cleaner hostel');
    });

    test('needs an agenda', async () => {
        const res = await apply(await as(await student()), (await takingApplications())._id, { agenda: '  ' });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Agenda is required');
    });

    test('only once per election, also when two requests arrive together', async () => {
        const target = await takingApplications();
        const agent = await as(await student());

        const answers = await Promise.all([apply(agent, target._id), apply(agent, target._id)]);
        const again = await apply(agent, target._id);

        expect(answers.map((res) => res.status).sort()).toEqual([201, 409]);
        expect(again.status).toBe(409);
        expect(again.body.message).toBe('You have already applied');
        expect(await Candidate.countDocuments()).toBe(1);
    });

    test('not after the deadline and not in a closed election', async () => {
        const agent = await as(await student());

        for (const target of [await openForVoting(), await closed()]) {
            const res = await apply(agent, target._id);
            expect(res.status).toBe(409);
            expect(res.body.message).toBe('Applications are closed');
        }
    });

    test('not by a student the election is not for, and not by faculty or admin', async () => {
        const target = await takingApplications({ eligibility: { department: 'Computer', year: 'TE', division: 'A' } });

        const otherDivision = await apply(await as(await student({ classDivision: 'B' })), target._id);
        const teacher = await apply(await as(await createUser({ role: 'faculty', department: 'Computer' })), target._id);
        const admin = await apply(await asAdmin(), target._id);

        expect(otherDivision.status).toBe(403);
        expect(otherDivision.body.message).toBe('You are not eligible for this election');
        expect(teacher.status).toBe(403);
        expect(admin.status).toBe(403);
    });
});

describe('deciding candidates', () => {
    test('an admin approves or rejects, and the student is told', async () => {
        const target = await takingApplications({ title: 'Sports secretary' });
        const first = await candidate(target, { status: 'Pending' });
        const second = await candidate(target, { status: 'Pending' });
        const agent = await asAdmin();

        const approved = await agent.patch(`${api}/${target._id}/candidates/${first._id}`).send({ status: 'Approved' });
        const rejected = await agent.patch(`${api}/${target._id}/candidates/${second._id}`).send({ status: 'Rejected' });

        expect(approved.status).toBe(200);
        expect(rejected.status).toBe(200);
        expect((await Candidate.findById(first._id)).status).toBe('Approved');
        expect((await Candidate.findById(second._id)).status).toBe('Rejected');
        const notice = await Notice.findOne({ user: first.student });
        expect(notice.title).toBe('Your candidacy was approved');
        expect(notice.body).toBe('Sports secretary');
        expect((await Notice.findOne({ user: second.student })).title).toBe('Your candidacy was rejected');
    });

    test('only Approved or Rejected are accepted', async () => {
        const target = await takingApplications();
        const applicant = await candidate(target, { status: 'Pending' });

        const res = await (await asAdmin()).patch(`${api}/${target._id}/candidates/${applicant._id}`).send({ status: 'Elected' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Status must be one of: Approved, Rejected');
    });

    test('a candidate of another election, an unknown one and a malformed id are 404', async () => {
        const target = await takingApplications();
        const elsewhere = await candidate(await takingApplications(), { status: 'Pending' });
        const agent = await asAdmin();

        for (const id of [elsewhere._id, '507f1f77bcf86cd799439011', 'nope']) {
            const res = await agent.patch(`${api}/${target._id}/candidates/${id}`).send({ status: 'Approved' });
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Candidate not found');
        }
        expect((await Candidate.findById(elsewhere._id)).status).toBe('Pending');
    });

    test('nothing can be decided once the election is closed', async () => {
        const target = await closed();
        const applicant = await candidate(target, { status: 'Pending' });

        const res = await (await asAdmin()).patch(`${api}/${target._id}/candidates/${applicant._id}`).send({ status: 'Approved' });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe('This election is already closed');
    });
});

describe('voting', () => {
    const vote = (agent, id, candidateId) => agent.post(`${api}/${id}/vote`).send({ candidateId });

    test('an eligible student votes once for an approved candidate', async () => {
        const target = await openForVoting();
        const runner = await candidate(target);
        const voter = await student();

        const res = await vote(await as(voter), target._id, runner._id);

        expect(res.status).toBe(201);
        expect(await votesFor(runner)).toBe(1);
        expect(await Vote.countDocuments({ election: target._id, voter: voter._id })).toBe(1);
    });

    test('a second vote is refused, also when two arrive at the same moment', async () => {
        const target = await openForVoting();
        const first = await candidate(target);
        const second = await candidate(target);
        const agent = await as(await student());

        const answers = await Promise.all([vote(agent, target._id, first._id), vote(agent, target._id, second._id)]);
        const again = await vote(agent, target._id, first._id);

        expect(answers.map((res) => res.status).sort()).toEqual([201, 409]);
        expect(again.status).toBe(409);
        expect(again.body.message).toBe('You have already voted');
        expect(await Vote.countDocuments()).toBe(1);
        expect([await votesFor(first), await votesFor(second)].sort()).toEqual([0, 1]);
    });

    test('not before the deadline and not after the voting day', async () => {
        const agent = await as(await student());

        for (const target of [await takingApplications(), await closed(), await openForVoting({ endedAt: new Date() })]) {
            const runner = await candidate(target);
            const res = await vote(agent, target._id, runner._id);
            expect(res.status).toBe(409);
            expect(res.body.message).toBe('Voting is not open');
        }
        expect(await Vote.countDocuments()).toBe(0);
    });

    test('the edges: a second before the deadline is too early, the last moment of the voting day is in time', async () => {
        const startOfToday = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
        const tooEarly = await election({ applicationDeadline: fromNow(1000), votingDay: fromNow(DAY) });
        // the voting day is today: voting runs to the end of the day, however late it is now
        const lastDay = await election({ applicationDeadline: fromNow(-DAY), votingDay: startOfToday });
        // the voting day was yesterday
        const dayAfter = await election({ applicationDeadline: fromNow(-3 * DAY), votingDay: new Date(startOfToday.getTime() - DAY) });
        const agent = await as(await student());

        expect((await vote(agent, tooEarly._id, (await candidate(tooEarly))._id)).status).toBe(409);
        expect((await vote(agent, lastDay._id, (await candidate(lastDay))._id)).status).toBe(201);
        expect((await vote(agent, dayAfter._id, (await candidate(dayAfter))._id)).status).toBe(409);
    });

    test('only an approved candidate of this election can be chosen', async () => {
        const target = await openForVoting();
        const pending = await candidate(target, { status: 'Pending' });
        const rejected = await candidate(target, { status: 'Rejected' });
        const elsewhere = await candidate(await openForVoting());
        const agent = await as(await student());

        for (const id of [pending._id, rejected._id, elsewhere._id, '507f1f77bcf86cd799439011', 'nope', undefined, { $ne: null }]) {
            const res = await vote(agent, target._id, id);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Choose an approved candidate of this election');
        }
        expect(await Vote.countDocuments()).toBe(0);
    });

    test('a student who meets only some of the rules cannot vote; neither can faculty or admin', async () => {
        const target = await openForVoting({ eligibility: { department: 'Computer', year: 'TE', division: 'A' } });
        const runner = await candidate(target);

        const twoOfThree = await vote(await as(await student({ classDivision: 'B' })), target._id, runner._id);
        const teacher = await vote(await as(await createUser({ role: 'faculty' })), target._id, runner._id);
        const admin = await vote(await asAdmin(), target._id, runner._id);

        expect(twoOfThree.status).toBe(403);
        expect(twoOfThree.body.message).toBe('You are not eligible for this election');
        expect(teacher.status).toBe(403);
        expect(admin.status).toBe(403);
        expect(await votesFor(runner)).toBe(0);
    });

    test('a candidate may vote, also for themselves', async () => {
        const me = await student();
        const target = await openForVoting();
        const mine = await candidate(target, { student: me });

        expect((await vote(await as(me), target._id, mine._id)).status).toBe(201);
    });

    test('who voted for whom is never sent', async () => {
        const target = await openForVoting();
        const runner = await candidate(target);
        const voter = await student();
        const agent = await as(voter);
        const cast = await vote(agent, target._id, runner._id);

        const detail = await (await asAdmin()).get(`${api}/${target._id}`);

        expect(JSON.stringify(cast.body)).not.toContain(String(runner._id));
        expect(JSON.stringify(detail.body)).not.toContain(String(voter._id));
        expect(detail.body.data).not.toHaveProperty('votes');
    });
});

describe('ending and winners', () => {
    test('an admin ends an election early; it is then closed', async () => {
        const admin = await createAdmin();
        const target = await openForVoting();

        const res = await (await as(admin)).patch(`${api}/${target._id}/end`);
        const again = await (await as(admin)).patch(`${api}/${target._id}/end`);

        expect(res.status).toBe(200);
        expect(res.body.data.election.stage).toBe('closed');
        const saved = await Election.findById(target._id);
        expect(saved.endedAt).toBeInstanceOf(Date);
        expect(String(saved.endedBy)).toBe(String(admin._id));
        expect(again.status).toBe(409);
        expect(again.body.message).toBe('This election is already closed');
    });

    test('the winner is the approved candidate with the most votes, shown only once closed', async () => {
        const voting = await openForVoting();
        await candidate(voting, { votes: 3 });
        const done = await closed();
        const best = await candidate(done, { votes: 7 });
        await candidate(done, { votes: 2 });
        await candidate(done, { votes: 9, status: 'Rejected' });
        const agent = await as(await student());

        const whileVoting = (await agent.get(`${api}/${voting._id}`)).body.data;
        const afterwards = (await agent.get(`${api}/${done._id}`)).body.data;

        expect(whileVoting.winners).toEqual([]);
        expect(afterwards.winners.map((item) => item._id)).toEqual([String(best._id)]);
        expect(afterwards.winners[0].votes).toBe(7);
    });

    test('a tie names every tied candidate, and no votes means no winner', async () => {
        const tied = await closed();
        await candidate(tied, { votes: 4 });
        await candidate(tied, { votes: 4 });
        await candidate(tied, { votes: 1 });
        const empty = await closed();
        await candidate(empty);
        const agent = await as(await student());

        expect((await agent.get(`${api}/${tied._id}`)).body.data.winners).toHaveLength(2);
        expect((await agent.get(`${api}/${empty._id}`)).body.data.winners).toEqual([]);
    });
});

describe('demo accounts and real data', () => {
    test('a demo account cannot apply, vote, decide or end in an election made by a real admin', async () => {
        const applying = await takingApplications();
        const voting = await openForVoting();
        const runner = await candidate(voting);
        const applicant = await candidate(applying, { status: 'Pending' });
        const demoStudent = await as(await student({ isDemo: true }));
        const demoAdmin = await asAdmin({ isDemo: true });

        const answers = [
            await demoStudent.post(`${api}/${applying._id}/candidates`).send({ agenda: 'x' }),
            await demoStudent.post(`${api}/${voting._id}/vote`).send({ candidateId: runner._id }),
            await demoAdmin.patch(`${api}/${applying._id}/candidates/${applicant._id}`).send({ status: 'Approved' }),
            await demoAdmin.patch(`${api}/${voting._id}/end`),
        ];

        for (const res of answers) {
            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Demo accounts can only change sample data');
        }
        expect(await Vote.countDocuments()).toBe(0);
        expect((await Election.findById(voting._id)).endedAt).toBeUndefined();
    });

    test('demo accounts can do all of it in a sample election, and can read real ones', async () => {
        const sample = await openForVoting({ isDemo: true });
        const runner = await candidate(sample);
        const real = await openForVoting();
        const demoStudent = await as(await student({ isDemo: true }));

        expect((await demoStudent.post(`${api}/${sample._id}/vote`).send({ candidateId: runner._id })).status).toBe(201);
        expect((await demoStudent.get(`${api}/${real._id}`)).status).toBe(200);
        expect((await (await asAdmin({ isDemo: true })).patch(`${api}/${sample._id}/end`)).status).toBe(200);
    });

    test('a real student can vote in a sample election', async () => {
        const sample = await openForVoting({ isDemo: true });
        const runner = await candidate(sample);

        expect((await (await as(await student())).post(`${api}/${sample._id}/vote`).send({ candidateId: runner._id })).status).toBe(201);
    });
});

describe('review fixes', () => {
    test('the counts shown are the votes that exist, whatever else is stored', async () => {
        const target = await openForVoting();
        const runner = await candidate(target);
        const voters = [await student(), await student(), await student()];
        for (const voter of voters) {
            await Vote.create({ election: target._id, voter: voter._id, candidate: runner._id });
        }

        const detail = (await (await as(await student())).get(`${api}/${target._id}`)).body.data;

        expect(detail.candidates[0].votes).toBe(3);
    });

    test('once voting has started an approved candidate cannot be rejected', async () => {
        const target = await openForVoting({ title: 'Running election' });
        const runner = await candidate(target, { votes: 2 });

        const res = await (await asAdmin()).patch(`${api}/${target._id}/candidates/${runner._id}`).send({ status: 'Rejected' });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe('A candidate cannot be rejected once voting has started');
        expect((await Candidate.findById(runner._id)).status).toBe('Approved');
        expect(await votesFor(runner)).toBe(2);
    });

    test('a pending candidate can still be approved or rejected during voting', async () => {
        const target = await openForVoting();
        const late = await candidate(target, { status: 'Pending' });
        const other = await candidate(target, { status: 'Pending' });
        const agent = await asAdmin();

        expect((await agent.patch(`${api}/${target._id}/candidates/${late._id}`).send({ status: 'Approved' })).status).toBe(200);
        expect((await agent.patch(`${api}/${target._id}/candidates/${other._id}`).send({ status: 'Rejected' })).status).toBe(200);
    });

    test('deciding the same way twice is refused and sends no second notice', async () => {
        const target = await takingApplications();
        const applicant = await candidate(target, { status: 'Pending' });
        const agent = await asAdmin();

        await agent.patch(`${api}/${target._id}/candidates/${applicant._id}`).send({ status: 'Approved' });
        const again = await agent.patch(`${api}/${target._id}/candidates/${applicant._id}`).send({ status: 'Approved' });

        expect(again.status).toBe(409);
        expect(again.body.message).toBe('This candidacy is already approved');
        expect(await Notice.countDocuments({ user: applicant.student })).toBe(1);
    });

    test('the list of elections has an upper size', async () => {
        await Election.insertMany(Array.from({ length: 205 }, (_, index) => ({ title: `Election ${index}`, applicationDeadline: fromNow(DAY), votingDay: fromNow(2 * DAY) })));

        const res = await (await as(await student())).get(api);

        expect(res.body.data.elections).toHaveLength(200);
    });
});

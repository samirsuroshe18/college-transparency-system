import { jest } from '@jest/globals';

// files are never really stored in tests
const storeFile = jest.fn(async (file) => (file ? 'https://files.example/complaint.pdf' : null));
jest.unstable_mockModule('../src/utils/uploads.js', () => ({ storeFile, uploadsEnabled: () => true }));

const request = (await import('supertest')).default;
const { default: app } = await import('../src/app.js');
const { Complaint } = await import('../src/models/complaint.model.js');
const { Notice } = await import('../src/models/notice.model.js');
const { hasOffensiveLanguage } = await import('../src/utils/language.js');
const { createUser, createAdmin, loginAgent } = await import('./helpers.js');

const api = '/api/v1/complaints';

const student = (overrides = {}) => createUser({ department: 'Computer', name: 'Riya Student', ...overrides });
const boardMember = (overrides = {}) => createUser({ role: 'faculty', isBoardMember: true, name: 'Board Member', ...overrides });
const as = (user) => loginAgent(user);

const complaint = async (overrides = {}) => {
    const author = overrides.author || await student();
    return Complaint.create({ title: 'Mess food is cold', description: 'Dinner is served cold most days.', ...overrides, author: author._id });
};

// the complaint as one user sees it in the list
const seenBy = async (user, id) => {
    const res = await (await as(user)).get(api);
    return res.body.data.complaints.find((item) => item._id === String(id));
};

beforeEach(() => storeFile.mockClear());

describe('language check', () => {
    test('finds offensive words and lets ordinary complaints through', () => {
        expect(hasOffensiveLanguage('This damn mess is shit')).toBe(true);
        expect(hasOffensiveLanguage('The mess food is cold and the hostel water is dirty')).toBe(false);
        expect(hasOffensiveLanguage('')).toBe(false);
    });
});

describe('access', () => {
    test('needs a login and an approved profile', async () => {
        const pending = await as(await student({ profileStatus: 'Pending' }));

        expect((await request(app).get(api)).status).toBe(401);
        expect((await pending.get(api)).status).toBe(403);
        expect((await pending.post(api).send({ title: 'x', description: 'y' })).status).toBe(403);
    });

    test('only students submit, only board members vote to reveal, only admins resolve', async () => {
        const target = await complaint({ isAnonymous: true });
        const staff = { faculty: await createUser({ role: 'faculty' }), admin: await createAdmin(), doctor: await createUser({ role: 'doctor' }) };

        for (const role of ['faculty', 'admin', 'doctor']) {
            const res = await (await as(staff[role])).post(api).send({ title: 'A title', description: 'A description' });
            expect(res.status).toBe(403);
            expect(res.body.message).toBe('You are not allowed to do this');
        }

        // a faculty member who is not on the board, a student, an admin
        for (const user of [staff.faculty, await student(), staff.admin]) {
            const res = await (await as(user)).post(`${api}/${target._id}/reveal-vote`);
            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Only board members can vote to reveal');
        }

        for (const user of [staff.faculty, await student(), await boardMember()]) {
            const res = await (await as(user)).patch(`${api}/${target._id}/resolve`).send({ note: 'Done' });
            expect(res.status).toBe(403);
        }
        expect(await Complaint.countDocuments()).toBe(1);
    });
});

describe('submitting', () => {
    test('a student submits a complaint under their name', async () => {
        const me = await student();

        const res = await (await as(me)).post(api).send({ title: '  Broken projector  ', description: 'Room 204 projector does not start.' });

        expect(res.status).toBe(201);
        const saved = await Complaint.findOne();
        expect(saved.title).toBe('Broken projector');
        expect(String(saved.author)).toBe(String(me._id));
        expect(saved.isAnonymous).toBe(false);
        expect(saved.status).toBe('open');
        expect(saved.isDemo).toBe(false);
        expect(res.body.data.complaint.author.name).toBe('Riya Student');
    });

    test('anonymous can be chosen in a JSON body and in a form, with a document', async () => {
        const agent = await as(await student());

        const json = await agent.post(api).send({ title: 'Ragging in hostel', description: 'Seniors are harassing juniors.', isAnonymous: true });
        const form = await agent.post(api)
            .field('title', 'Unfair marking').field('description', 'Marks were cut without reason.').field('isAnonymous', 'true')
            .attach('document', Buffer.alloc(300), { filename: 'sheet.pdf', contentType: 'application/pdf' });

        expect(json.status).toBe(201);
        expect(form.status).toBe(201);
        expect(json.body.data.complaint.author).toBeNull();
        const saved = await Complaint.findOne({ title: 'Unfair marking' });
        expect(saved.isAnonymous).toBe(true);
        expect(saved.documentUrl).toBe('https://files.example/complaint.pdf');
        expect(storeFile.mock.calls[0][1]).toBe('complaints');
    });

    test('needs a title and a description, within their limits', async () => {
        const agent = await as(await student());

        expect((await agent.post(api).send({ description: 'x' })).body.message).toBe('Title is required');
        expect((await agent.post(api).send({ title: 'x' })).body.message).toBe('Description is required');
        expect((await agent.post(api).send({ title: 'a'.repeat(121), description: 'x' })).body.message).toBe('Title must be at most 120 characters');
        expect((await agent.post(api).send({ title: 'x', description: 'a'.repeat(2001) })).body.message).toBe('Description must be at most 2000 characters');
        expect(await Complaint.countDocuments()).toBe(0);
    });

    test('offensive language in the title or the description is refused, and no file is stored', async () => {
        const agent = await as(await student());

        const inTitle = await agent.post(api).send({ title: 'This shit canteen', description: 'The food is cold.' });
        const inDescription = await agent.post(api)
            .field('title', 'Canteen').field('description', 'The staff are assholes.')
            .attach('document', Buffer.alloc(300), { filename: 'a.pdf', contentType: 'application/pdf' });

        for (const res of [inTitle, inDescription]) {
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Please remove offensive language');
        }
        expect(await Complaint.countDocuments()).toBe(0);
        expect(storeFile).not.toHaveBeenCalled();
    });

    test('a complaint by a demo student is sample data', async () => {
        await (await as(await student({ isDemo: true }))).post(api).send({ title: 'Sample', description: 'Sample complaint.' });
        expect((await Complaint.findOne()).isDemo).toBe(true);
    });
});

describe('the list', () => {
    test('newest first, with the author of named complaints', async () => {
        const author = await student({ name: 'Named Author' });
        await complaint({ author, title: 'Older', createdAt: new Date(Date.now() - 60000) });
        await complaint({ author, title: 'Newer' });

        const res = await (await as(await student())).get(api);

        expect(res.body.data.complaints.map((item) => item.title)).toEqual(['Newer', 'Older']);
        expect(res.body.data.complaints[0].author).toEqual({ _id: String(author._id), name: 'Named Author', department: 'Computer' });
    });

    test('an anonymous author is hidden from everyone, including admins and the board', async () => {
        const author = await student({ name: 'Hidden Author' });
        const target = await complaint({ author, isAnonymous: true });

        for (const viewer of [await student(), await createAdmin(), await boardMember(), await createUser({ role: 'doctor' })]) {
            const res = await (await as(viewer)).get(api);
            const text = JSON.stringify(res.body);
            expect(res.body.data.complaints[0].author).toBeNull();
            expect(text).not.toContain('Hidden Author');
            expect(text).not.toContain(String(author._id));
        }
        expect((await seenBy(await student(), target._id)).mine).toBe(false);
    });

    test('the author still sees their anonymous complaint as their own, without their name on it', async () => {
        const author = await student({ name: 'Hidden Author' });
        const target = await complaint({ author, isAnonymous: true });

        const mine = await seenBy(author, target._id);

        expect(mine.mine).toBe(true);
        expect(mine.author).toBeNull();
    });

    test('votes are counted and the caller sees their own vote, never who else voted', async () => {
        const me = await student();
        const other = await student();
        const target = await complaint({ votes: [{ user: me._id, value: 1 }, { user: other._id, value: -1 }] });

        const item = await seenBy(me, target._id);

        expect(item.upvotes).toBe(1);
        expect(item.downvotes).toBe(1);
        expect(item.myVote).toBe('up');
        expect(item).not.toHaveProperty('votes');
        expect(JSON.stringify(item)).not.toContain(String(other._id));
    });

    test('reveal figures are shown to board members and admins only', async () => {
        await boardMember();
        await boardMember();
        const member = await boardMember();
        const target = await complaint({ isAnonymous: true, revealVotes: [member._id] });

        const forBoard = await seenBy(member, target._id);
        const forAdmin = await seenBy(await createAdmin(), target._id);
        const forStudent = await seenBy(await student(), target._id);

        expect(forBoard.revealVotes).toBe(1);
        expect(forBoard.revealNeeded).toBe(2);
        expect(forBoard.myRevealVote).toBe(true);
        expect(forAdmin.revealVotes).toBe(1);
        expect(forStudent).not.toHaveProperty('revealVotes');
        expect(forStudent).not.toHaveProperty('revealNeeded');
    });
});

describe('voting on a complaint', () => {
    const vote = (agent, id, value) => agent.post(`${api}/${id}/vote`).send({ value });

    test('any approved user votes once; voting again changes or removes the vote', async () => {
        const target = await complaint();
        const agent = await as(await createUser({ role: 'faculty' }));

        const up = await vote(agent, target._id, 'up');
        expect(up.status).toBe(200);
        expect(up.body.data.complaint.upvotes).toBe(1);

        await vote(agent, target._id, 'up');
        expect((await Complaint.findById(target._id)).votes).toHaveLength(1);

        const down = await vote(agent, target._id, 'down');
        expect(down.body.data.complaint.upvotes).toBe(0);
        expect(down.body.data.complaint.downvotes).toBe(1);
        expect(down.body.data.complaint.myVote).toBe('down');

        const none = await vote(agent, target._id, 'none');
        expect(none.body.data.complaint.downvotes).toBe(0);
        expect(none.body.data.complaint.myVote).toBeNull();
        expect((await Complaint.findById(target._id)).votes).toHaveLength(0);
    });

    test('several users each count once, also when their votes arrive together', async () => {
        const target = await complaint();
        const agents = await Promise.all([1, 2, 3, 4].map(async () => as(await student())));

        await Promise.all(agents.map((agent) => vote(agent, target._id, 'up')));

        expect((await Complaint.findById(target._id)).votes).toHaveLength(4);
    });

    test('other values, unknown complaints and malformed ids are refused', async () => {
        const target = await complaint();
        const agent = await as(await student());

        const wrong = await vote(agent, target._id, 'sideways');
        expect(wrong.status).toBe(400);
        expect(wrong.body.message).toBe('Value must be one of: up, down, none');

        for (const id of ['507f1f77bcf86cd799439011', 'nope']) {
            const res = await vote(agent, id, 'up');
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Complaint not found');
        }
    });

    test('the answer to a vote on an anonymous complaint does not name its author', async () => {
        const author = await student({ name: 'Hidden Author' });
        const target = await complaint({ author, isAnonymous: true });

        const res = await vote(await as(await student()), target._id, 'up');

        expect(JSON.stringify(res.body)).not.toContain('Hidden Author');
        expect(JSON.stringify(res.body)).not.toContain(String(author._id));
    });
});

describe('revealing an anonymous author', () => {
    const reveal = (agent, id) => agent.post(`${api}/${id}/reveal-vote`);

    test('the name appears only when more than half of the board has voted', async () => {
        const board = [await boardMember(), await boardMember(), await boardMember(), await boardMember()];
        const author = await student({ name: 'Hidden Author' });
        const target = await complaint({ author, isAnonymous: true });

        // two of four is half, not more than half
        const first = await reveal(await as(board[0]), target._id);
        const second = await reveal(await as(board[1]), target._id);
        expect(first.status).toBe(200);
        expect(second.body.data.complaint.revealed).toBe(false);
        expect((await seenBy(await student(), target._id)).author).toBeNull();
        expect(JSON.stringify(second.body)).not.toContain('Hidden Author');

        const third = await reveal(await as(board[2]), target._id);
        expect(third.body.data.complaint.revealed).toBe(true);
        expect(third.body.data.complaint.author.name).toBe('Hidden Author');
        expect((await seenBy(await student(), target._id)).author.name).toBe('Hidden Author');
        expect((await Complaint.findById(target._id)).revealedAt).toBeInstanceOf(Date);
    });

    test('the author is told when their name is revealed', async () => {
        const member = await boardMember();
        const author = await student();
        const target = await complaint({ author, isAnonymous: true, title: 'Ragging' });

        await reveal(await as(member), target._id);

        const notice = await Notice.findOne({ user: author._id });
        expect(notice.title).toBe('Your name on a complaint was revealed');
        expect(notice.body).toBe('Ragging');
    });

    test('a board member votes once', async () => {
        const member = await boardMember();
        await boardMember();
        await boardMember();
        const target = await complaint({ isAnonymous: true });
        const agent = await as(member);

        await reveal(agent, target._id);
        const again = await reveal(agent, target._id);

        expect(again.status).toBe(409);
        expect(again.body.message).toBe('You have already voted to reveal');
        expect((await Complaint.findById(target._id)).revealVotes).toHaveLength(1);
    });

    test('there is nothing to reveal on a named or already revealed complaint', async () => {
        const agent = await as(await boardMember());

        for (const target of [await complaint(), await complaint({ isAnonymous: true, revealedAt: new Date() })]) {
            const res = await reveal(agent, target._id);
            expect(res.status).toBe(409);
            expect(res.body.message).toBe('There is nothing to reveal');
        }
    });

    test('a board member whose profile is not approved does not count and cannot vote', async () => {
        const approved = await boardMember();
        const pending = await boardMember({ profileStatus: 'Pending' });
        const target = await complaint({ isAnonymous: true });

        expect((await reveal(await as(pending), target._id)).status).toBe(403);
        // the board is one approved member, so one vote is a majority
        expect((await reveal(await as(approved), target._id)).body.data.complaint.revealed).toBe(true);
    });

    test('the sample board decides sample complaints and the real board real ones', async () => {
        const demoBoard = [await boardMember({ isDemo: true }), await boardMember({ isDemo: true }), await boardMember({ isDemo: true })];
        const realMember = await boardMember();
        const realComplaint = await complaint({ isAnonymous: true });
        const sampleComplaint = await complaint({ isAnonymous: true, isDemo: true });

        // demo board members cannot touch a real complaint
        for (const member of demoBoard) {
            const res = await reveal(await as(member), realComplaint._id);
            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Demo accounts can only change sample data');
        }
        expect((await Complaint.findById(realComplaint._id)).revealVotes).toHaveLength(0);

        // the real board is one member here, whatever the size of the sample board
        expect((await seenBy(realMember, realComplaint._id)).revealNeeded).toBe(1);

        // two of the three sample members reveal a sample complaint
        await reveal(await as(demoBoard[0]), sampleComplaint._id);
        const second = await reveal(await as(demoBoard[1]), sampleComplaint._id);
        expect(second.body.data.complaint.revealed).toBe(true);
    });
});

describe('resolving', () => {
    test('an admin resolves with a note, and the author is told', async () => {
        const admin = await createAdmin({ name: 'The Admin' });
        const author = await student();
        const target = await complaint({ author, title: 'Broken projector' });

        const res = await (await as(admin)).patch(`${api}/${target._id}/resolve`).send({ note: 'Projector replaced on Monday.' });

        expect(res.status).toBe(200);
        expect(res.body.data.complaint.status).toBe('resolved');
        expect(res.body.data.complaint.resolution.note).toBe('Projector replaced on Monday.');
        expect(res.body.data.complaint.resolution.by.name).toBe('The Admin');
        const saved = await Complaint.findById(target._id);
        expect(String(saved.resolution.by)).toBe(String(admin._id));
        expect(saved.resolution.at).toBeInstanceOf(Date);
        const notice = await Notice.findOne({ user: author._id });
        expect(notice.title).toBe('Your complaint was resolved');
        expect(notice.body).toBe('Broken projector');
    });

    test('needs a note, and can be done once', async () => {
        const target = await complaint();
        const agent = await as(await createAdmin());

        const noNote = await agent.patch(`${api}/${target._id}/resolve`).send({ note: ' ' });
        await agent.patch(`${api}/${target._id}/resolve`).send({ note: 'Fixed.' });
        const again = await agent.patch(`${api}/${target._id}/resolve`).send({ note: 'Fixed again.' });

        expect(noNote.status).toBe(400);
        expect(noNote.body.message).toBe('Note is required');
        expect(again.status).toBe(409);
        expect(again.body.message).toBe('This complaint is already resolved');
    });

    test('resolving an anonymous complaint does not name its author', async () => {
        const author = await student({ name: 'Hidden Author' });
        const target = await complaint({ author, isAnonymous: true });

        const res = await (await as(await createAdmin())).patch(`${api}/${target._id}/resolve`).send({ note: 'Handled.' });

        expect(res.status).toBe(200);
        expect(JSON.stringify(res.body)).not.toContain('Hidden Author');
        expect(JSON.stringify(res.body)).not.toContain(String(author._id));
    });
});

describe('demo accounts and real data', () => {
    test('a demo account cannot vote on or resolve a real complaint, and can do both on a sample one', async () => {
        const real = await complaint();
        const sample = await complaint({ isDemo: true });
        const demoStudent = await as(await student({ isDemo: true }));
        const demoAdmin = await as(await createAdmin({ isDemo: true }));

        const refused = [
            await demoStudent.post(`${api}/${real._id}/vote`).send({ value: 'up' }),
            await demoAdmin.patch(`${api}/${real._id}/resolve`).send({ note: 'x' }),
        ];
        for (const res of refused) {
            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Demo accounts can only change sample data');
        }

        expect((await demoStudent.post(`${api}/${sample._id}/vote`).send({ value: 'up' })).status).toBe(200);
        expect((await demoAdmin.patch(`${api}/${sample._id}/resolve`).send({ note: 'Done.' })).status).toBe(200);
        expect((await Complaint.findById(real._id)).votes).toHaveLength(0);
    });
});

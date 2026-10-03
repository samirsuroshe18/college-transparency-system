import request from 'supertest';
import app from '../src/app.js';
import { Facility } from '../src/models/facility.model.js';
import { Booking } from '../src/models/booking.model.js';
import { Notice } from '../src/models/notice.model.js';
import { collegeDayFromNow } from '../src/utils/collegeTime.js';
import { createUser, createAdmin, loginAgent } from './helpers.js';

const facilitiesApi = '/api/v1/facilities';
const api = '/api/v1/bookings';

const as = (user) => loginAgent(user);
const student = (overrides = {}) => createUser({ name: 'Riya Student', ...overrides });

// a date some days from today, as the forms send it
const dayFromNow = (days) => collegeDayFromNow(days);
const TOMORROW = dayFromNow(1);

const facility = (overrides = {}) => Facility.create({ name: 'Seminar Hall', description: 'Seats 120', location: 'Block A', ...overrides });

const booking = async (overrides = {}) => {
    const target = overrides.facility || await facility();
    const user = overrides.user || await student();
    return Booking.create({
        date: TOMORROW, startTime: '10:00', endTime: '11:00', purpose: 'Club meeting',
        ...overrides, facility: target._id, user: user._id,
    });
};

const form = (target, overrides = {}) => ({ facility: String(target._id), date: TOMORROW, startTime: '10:00', endTime: '11:00', purpose: 'Club meeting', ...overrides });

describe('access', () => {
    test('needs a login and an approved profile', async () => {
        const pending = await as(await student({ profileStatus: 'Pending' }));

        expect((await request(app).get(facilitiesApi)).status).toBe(401);
        expect((await request(app).get(api)).status).toBe(401);
        expect((await pending.get(facilitiesApi)).status).toBe(403);
        expect((await pending.post(api).send({})).status).toBe(403);
    });

    test('facilities are managed and requests decided by admins only', async () => {
        const hall = await facility();
        const request_ = await booking({ facility: hall });

        for (const role of ['student', 'faculty', 'doctor']) {
            const agent = await as(await createUser({ role }));
            const answers = [
                await agent.post(facilitiesApi).send({ name: 'Lab', description: 'x', location: 'y' }),
                await agent.patch(`${facilitiesApi}/${hall._id}`).send({ available: false }),
                await agent.patch(`${api}/${request_._id}`).send({ status: 'approved' }),
            ];
            for (const res of answers) {
                expect(res.status).toBe(403);
                expect(res.body.message).toBe('You are not allowed to do this');
            }
        }
    });

    test('admins and the doctor do not request facilities', async () => {
        const hall = await facility();

        for (const user of [await createAdmin(), await createUser({ role: 'doctor' })]) {
            const res = await (await as(user)).post(api).send(form(hall));
            expect(res.status).toBe(403);
        }
    });
});

describe('facilities', () => {
    test('an admin adds a facility and everyone can list them', async () => {
        const admin = await createAdmin();

        const res = await (await as(admin)).post(facilitiesApi).send({ name: ' Computer Lab 2 ', description: '40 machines', location: 'Block C' });
        const list = await (await as(await student())).get(facilitiesApi);

        expect(res.status).toBe(201);
        expect(list.body.data.facilities.map((item) => item.name)).toEqual(['Computer Lab 2']);
        expect(list.body.data.facilities[0].available).toBe(true);
        expect(String((await Facility.findOne()).createdBy)).toBe(String(admin._id));
    });

    test('needs a name, a description and a location', async () => {
        const agent = await as(await createAdmin());

        expect((await agent.post(facilitiesApi).send({ description: 'x', location: 'y' })).body.message).toBe('Name is required');
        expect((await agent.post(facilitiesApi).send({ name: 'x', location: 'y' })).body.message).toBe('Description is required');
        expect((await agent.post(facilitiesApi).send({ name: 'x', description: 'y' })).body.message).toBe('Location is required');
    });

    test('an admin edits a facility and marks it unavailable; what is not sent stays', async () => {
        const hall = await facility();
        const agent = await as(await createAdmin());

        const res = await agent.patch(`${facilitiesApi}/${hall._id}`).send({ available: false, location: 'Block B' });

        expect(res.status).toBe(200);
        const saved = await Facility.findById(hall._id);
        expect(saved.available).toBe(false);
        expect(saved.location).toBe('Block B');
        expect(saved.name).toBe('Seminar Hall');
    });

    test('an unknown or malformed facility id is 404', async () => {
        const agent = await as(await createAdmin());
        for (const id of ['507f1f77bcf86cd799439011', 'nope']) {
            const res = await agent.patch(`${facilitiesApi}/${id}`).send({ available: false });
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Facility not found');
        }
    });
});

describe('requesting a booking', () => {
    test('a student or a faculty member requests a facility; the request waits for a decision', async () => {
        const hall = await facility();
        const me = await student();

        const res = await (await as(me)).post(api).send(form(hall));
        const byFaculty = await (await as(await createUser({ role: 'faculty' }))).post(api).send(form(hall, { startTime: '14:00', endTime: '15:30' }));

        expect(res.status).toBe(201);
        expect(byFaculty.status).toBe(201);
        const saved = await Booking.findOne({ user: me._id });
        expect(saved.status).toBe('pending');
        expect(saved.date).toBe(TOMORROW);
        expect(saved.startTime).toBe('10:00');
        expect(saved.purpose).toBe('Club meeting');
    });

    test('the date and times must be well formed, in order, and not in the past', async () => {
        const hall = await facility();
        const agent = await as(await student());
        const send = (overrides) => agent.post(api).send(form(hall, overrides));

        expect((await send({ date: '12/11/2026' })).body.message).toBe('The date must be YYYY-MM-DD');
        expect((await send({ date: '2026-02-30' })).body.message).toBe('The date must be YYYY-MM-DD');
        expect((await send({ startTime: '9am' })).body.message).toBe('Times must be HH:MM');
        expect((await send({ endTime: '25:00' })).body.message).toBe('Times must be HH:MM');
        expect((await send({ startTime: '11:00', endTime: '11:00' })).body.message).toBe('The end time must be after the start time');
        expect((await send({ startTime: '12:00', endTime: '11:00' })).body.message).toBe('The end time must be after the start time');
        expect((await send({ date: dayFromNow(-1) })).body.message).toBe('The date cannot be in the past');
        expect((await send({ purpose: ' ' })).body.message).toBe('Purpose is required');
        expect(await Booking.countDocuments()).toBe(0);
    });

    test('a booking for today is allowed', async () => {
        const res = await (await as(await student())).post(api).send(form(await facility(), { date: dayFromNow(0), startTime: '23:00', endTime: '23:59' }));
        expect(res.status).toBe(201);
    });

    test('the facility must exist and be available', async () => {
        const closedHall = await facility({ available: false });
        const agent = await as(await student());

        const unavailable = await agent.post(api).send(form(closedHall));
        expect(unavailable.status).toBe(409);
        expect(unavailable.body.message).toBe('This facility is not available');

        for (const id of ['507f1f77bcf86cd799439011', 'nope', { $ne: null }]) {
            const res = await agent.post(api).send(form(closedHall, { facility: id }));
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Facility not found');
        }
    });

    test('a request that overlaps an approved booking is refused', async () => {
        const hall = await facility();
        await booking({ facility: hall, status: 'approved', startTime: '10:00', endTime: '12:00' });
        const agent = await as(await student());

        for (const [startTime, endTime] of [['09:00', '10:30'], ['11:00', '13:00'], ['10:30', '11:30'], ['09:00', '13:00'], ['10:00', '12:00']]) {
            const res = await agent.post(api).send(form(hall, { startTime, endTime }));
            expect(res.status).toBe(409);
            expect(res.body.message).toBe('This time overlaps an approved booking');
        }
    });

    test('touching an approved booking at its edge, another day, another facility and unapproved requests do not block', async () => {
        const hall = await facility();
        const otherHall = await facility({ name: 'Auditorium' });
        await booking({ facility: hall, status: 'approved', startTime: '10:00', endTime: '12:00' });
        await booking({ facility: hall, status: 'pending', startTime: '14:00', endTime: '15:00' });
        await booking({ facility: hall, status: 'rejected', startTime: '16:00', endTime: '17:00' });
        await booking({ facility: hall, status: 'cancelled', startTime: '18:00', endTime: '19:00' });
        const agent = await as(await student());

        const allowed = [
            form(hall, { startTime: '12:00', endTime: '13:00' }),
            form(hall, { startTime: '09:00', endTime: '10:00' }),
            form(hall, { date: dayFromNow(2) }),
            form(otherHall),
            form(hall, { startTime: '14:00', endTime: '15:00' }),
            form(hall, { startTime: '16:00', endTime: '17:00' }),
            form(hall, { startTime: '18:00', endTime: '19:00' }),
        ];

        for (const body of allowed) {
            expect((await agent.post(api).send(body)).status).toBe(201);
        }
    });
});

describe('the list', () => {
    test('shows every booking with its facility and requester, and can be narrowed', async () => {
        const hall = await facility();
        const lab = await facility({ name: 'Lab' });
        const me = await student({ name: 'Me Myself' });
        await booking({ facility: hall, user: me, date: dayFromNow(1) });
        await booking({ facility: lab, date: dayFromNow(3) });
        const agent = await as(me);

        const all = await agent.get(api);
        const mine = await agent.get(api).query({ mine: 'true' });
        const ofLab = await agent.get(api).query({ facility: String(lab._id) });
        const bad = await agent.get(api).query({ facility: 'nope' });

        expect(all.body.data.bookings).toHaveLength(2);
        expect(all.body.data.bookings[0].facility.name).toBe('Lab');
        expect(all.body.data.bookings[1].user.name).toBe('Me Myself');
        expect(all.body.data.bookings[1].user).not.toHaveProperty('email');
        expect(all.body.data.bookings[1].mine).toBe(true);
        expect(mine.body.data.bookings.map((item) => item.facility.name)).toEqual(['Seminar Hall']);
        expect(ofLab.body.data.bookings).toHaveLength(1);
        expect(bad.body.data.bookings).toEqual([]);
    });
});

describe('deciding', () => {
    const decide = (agent, id, body) => agent.patch(`${api}/${id}`).send(body);

    test('an admin approves, and the requester is told', async () => {
        const admin = await createAdmin();
        const hall = await facility();
        const me = await student();
        const target = await booking({ facility: hall, user: me });

        const res = await decide(await as(admin), target._id, { status: 'approved' });

        expect(res.status).toBe(200);
        const saved = await Booking.findById(target._id);
        expect(saved.status).toBe('approved');
        expect(String(saved.decidedBy)).toBe(String(admin._id));
        expect(saved.decidedAt).toBeInstanceOf(Date);
        const notice = await Notice.findOne({ user: me._id });
        expect(notice.title).toBe('Your booking was approved');
        expect(notice.body).toBe(`Seminar Hall, ${TOMORROW} 10:00 to 11:00`);
    });

    test('rejecting needs a reason, which the requester sees', async () => {
        const me = await student();
        const target = await booking({ user: me });
        const agent = await as(await createAdmin());

        const noReason = await decide(agent, target._id, { status: 'rejected' });
        const rejected = await decide(agent, target._id, { status: 'rejected', reason: 'Exam in the hall' });

        expect(noReason.status).toBe(400);
        expect(noReason.body.message).toBe('A reason is required');
        expect(rejected.status).toBe(200);
        expect((await Booking.findById(target._id)).reason).toBe('Exam in the hall');
        expect((await Notice.findOne({ user: me._id })).body).toContain('Exam in the hall');
    });

    test('only approved or rejected are accepted, and only once', async () => {
        const target = await booking();
        const agent = await as(await createAdmin());

        const wrong = await decide(agent, target._id, { status: 'cancelled' });
        await decide(agent, target._id, { status: 'approved' });
        const again = await decide(agent, target._id, { status: 'rejected', reason: 'Changed my mind' });

        expect(wrong.status).toBe(400);
        expect(wrong.body.message).toBe('Status must be one of: approved, rejected');
        expect(again.status).toBe(409);
        expect(again.body.message).toBe('This request has already been decided');
        expect((await Booking.findById(target._id)).status).toBe('approved');
    });

    test('approving a request that overlaps an approved booking is refused', async () => {
        const hall = await facility();
        await booking({ facility: hall, status: 'approved', startTime: '10:00', endTime: '12:00' });
        const clash = await booking({ facility: hall, startTime: '11:00', endTime: '13:00' });
        const next = await booking({ facility: hall, startTime: '12:00', endTime: '13:00' });
        const agent = await as(await createAdmin());

        const refused = await decide(agent, clash._id, { status: 'approved' });
        const allowed = await decide(agent, next._id, { status: 'approved' });

        expect(refused.status).toBe(409);
        expect(refused.body.message).toBe('This time overlaps an approved booking');
        expect((await Booking.findById(clash._id)).status).toBe('pending');
        expect(allowed.status).toBe(200);
    });

    test('two overlapping requests approved at the same moment: only one ends up approved', async () => {
        const hall = await facility();
        const first = await booking({ facility: hall, startTime: '10:00', endTime: '12:00' });
        const second = await booking({ facility: hall, startTime: '11:00', endTime: '13:00' });
        const one = await as(await createAdmin());
        const two = await as(await createAdmin());

        const answers = await Promise.all([
            decide(one, first._id, { status: 'approved' }),
            decide(two, second._id, { status: 'approved' }),
        ]);

        expect(answers.map((res) => res.status).sort()).toEqual([200, 409]);
        expect(await Booking.countDocuments({ facility: hall._id, status: 'approved' })).toBe(1);
        expect(await Booking.countDocuments({ facility: hall._id, status: 'pending' })).toBe(1);
    });

    test('an unknown or malformed booking id is 404', async () => {
        const agent = await as(await createAdmin());
        for (const id of ['507f1f77bcf86cd799439011', 'nope']) {
            const res = await decide(agent, id, { status: 'approved' });
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Booking not found');
        }
    });
});

describe('cancelling', () => {
    test('the requester cancels their own pending request', async () => {
        const me = await student();
        const target = await booking({ user: me });

        const res = await (await as(me)).delete(`${api}/${target._id}`);

        expect(res.status).toBe(200);
        expect((await Booking.findById(target._id)).status).toBe('cancelled');
    });

    test('not someone else\'s request, and not one that was already decided', async () => {
        const me = await student();
        const theirs = await booking();
        const approved = await booking({ user: me, status: 'approved' });
        const agent = await as(me);

        const notMine = await agent.delete(`${api}/${theirs._id}`);
        const decided = await agent.delete(`${api}/${approved._id}`);

        expect(notMine.status).toBe(404);
        expect(notMine.body.message).toBe('Booking not found');
        expect(decided.status).toBe(409);
        expect(decided.body.message).toBe('This request has already been decided');
        expect((await Booking.findById(theirs._id)).status).toBe('pending');
    });
});

describe('demo accounts and real data', () => {
    test('what a demo account makes is sample data', async () => {
        const res = await (await as(await createAdmin({ isDemo: true }))).post(facilitiesApi).send({ name: 'Sample Hall', description: 'x', location: 'y' });
        const hall = await Facility.findById(res.body.data.facility._id);
        await (await as(await student({ isDemo: true }))).post(api).send(form(hall));

        expect(hall.isDemo).toBe(true);
        expect((await Booking.findOne()).isDemo).toBe(true);
    });

    test('a demo account cannot edit a real facility, book it, or decide a real request', async () => {
        const realHall = await facility();
        const realRequest = await booking({ facility: realHall });
        const demoAdmin = await as(await createAdmin({ isDemo: true }));
        const demoStudent = await as(await student({ isDemo: true }));

        const answers = [
            await demoAdmin.patch(`${facilitiesApi}/${realHall._id}`).send({ available: false }),
            await demoStudent.post(api).send(form(realHall, { startTime: '15:00', endTime: '16:00' })),
            await demoAdmin.patch(`${api}/${realRequest._id}`).send({ status: 'approved' }),
        ];

        for (const res of answers) {
            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Demo accounts can only change sample data');
        }
        expect((await Facility.findById(realHall._id)).available).toBe(true);
        expect((await Booking.findById(realRequest._id)).status).toBe('pending');
    });

    test('a real student can book a sample facility, and the demo admin can decide a sample request', async () => {
        const sampleHall = await facility({ isDemo: true });
        const sampleRequest = await booking({ facility: sampleHall, isDemo: true });

        expect((await (await as(await student())).post(api).send(form(sampleHall, { startTime: '15:00', endTime: '16:00' }))).status).toBe(201);
        expect((await (await as(await createAdmin({ isDemo: true }))).patch(`${api}/${sampleRequest._id}`).send({ status: 'approved' })).status).toBe(200);
    });
});

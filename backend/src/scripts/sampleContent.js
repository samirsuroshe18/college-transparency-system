// What happens in the sample college: elections, complaints, bookings and applications
// in different states, so that every page has something to show and every role
// something to do. All of it is marked isDemo and is rebuilt with the sample accounts.
import { Election } from '../models/election.model.js';
import { Candidate } from '../models/candidate.model.js';
import { Vote } from '../models/vote.model.js';
import { Complaint } from '../models/complaint.model.js';
import { Facility } from '../models/facility.model.js';
import { Booking } from '../models/booking.model.js';
import { Application } from '../models/application.model.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const fromNow = (days) => new Date(Date.now() + days * DAY_MS);
const dayFromNow = (days) => fromNow(days).toISOString().slice(0, 10);

// Removes the sample content, and with it whatever anyone did to it: a real user's
// vote in a sample election or booking of a sample facility would otherwise point at nothing.
const removeSampleContent = async () => {
    const electionIds = await Election.find({ isDemo: true }).distinct('_id');
    await Vote.deleteMany({ election: { $in: electionIds } });
    await Candidate.deleteMany({ election: { $in: electionIds } });
    await Election.deleteMany({ _id: { $in: electionIds } });

    await Complaint.deleteMany({ isDemo: true });

    const facilityIds = await Facility.find({ isDemo: true }).distinct('_id');
    await Booking.deleteMany({ $or: [{ isDemo: true }, { facility: { $in: facilityIds } }] });
    await Facility.deleteMany({ _id: { $in: facilityIds } });

    await Application.deleteMany({ isDemo: true });
};

const buildElections = async (who) => {
    // taking applications
    const upcoming = await Election.create({
        title: 'Cultural Secretary',
        description: 'Leads the cultural committee for the academic year.',
        applicationDeadline: fromNow(5),
        votingDay: fromNow(8),
        createdBy: who.admin._id,
        isDemo: true,
    });
    await Candidate.create([
        { election: upcoming._id, student: who.vihaan._id, status: 'Approved', decidedBy: who.admin._id, agenda: 'One inter-college festival every semester, planned with a public budget.', experience: 'Organised the freshers event last year.' },
        { election: upcoming._id, student: who.ananya._id, status: 'Pending', agenda: 'Weekly open-mic evenings and a music room that can actually be booked.', experience: 'Member of the music club for two years.' },
    ]);

    // open for voting; the demo student can vote and has not voted yet
    const current = await Election.create({
        title: 'Class Representative, Computer TE',
        description: 'Speaks for the third-year Computer class in department meetings.',
        applicationDeadline: fromNow(-2),
        votingDay: fromNow(1),
        eligibility: { department: 'Computer', year: 'TE' },
        createdBy: who.admin._id,
        isDemo: true,
    });
    const [aarav, diya] = await Candidate.create([
        { election: current._id, student: who.aarav._id, status: 'Approved', decidedBy: who.admin._id, agenda: 'Lab timings that match the timetable, and a shared calendar for submissions.', experience: 'Class monitor in the second year.' },
        { election: current._id, student: who.diya._id, status: 'Approved', decidedBy: who.admin._id, agenda: 'A monthly meeting with the class coordinator, with minutes posted for everyone.', experience: 'Coordinator of the coding club.' },
        { election: current._id, student: who.kabir._id, status: 'Approved', decidedBy: who.admin._id, agenda: 'Better project guidance and earlier notice of internal assessment dates.', experience: 'Volunteer at the department festival.' },
    ]);
    await castVotes(current, [[who.aarav, diya], [who.diya, diya], [who.kabir, aarav]]);

    // closed, with a winner
    const past = await Election.create({
        title: 'Sports Secretary',
        description: 'Runs the sports committee and the annual sports week.',
        applicationDeadline: fromNow(-20),
        votingDay: fromNow(-14),
        createdBy: who.admin._id,
        isDemo: true,
    });
    const [ananya, meera] = await Candidate.create([
        { election: past._id, student: who.ananya._id, status: 'Approved', decidedBy: who.admin._id, agenda: 'Evening slots on the ground for every department, booked in the open.', experience: 'Captain of the badminton team.' },
        { election: past._id, student: who.meera._id, status: 'Approved', decidedBy: who.admin._id, agenda: 'New equipment for the gym and a fair selection process for teams.', experience: 'State-level athlete.' },
    ]);
    await castVotes(past, [[who.aarav, ananya], [who.diya, ananya], [who.kabir, meera], [who.vihaan, ananya]]);
};

// stores each vote and keeps the candidates' counts in step with them
const castVotes = async (election, votes) => {
    for (const [voter, candidate] of votes) {
        await Vote.create({ election: election._id, voter: voter._id, candidate: candidate._id });
        await Candidate.updateOne({ _id: candidate._id }, { $inc: { votes: 1 } });
    }
};

const up = (user) => ({ user: user._id, value: 1 });
const down = (user) => ({ user: user._id, value: -1 });

const buildComplaints = (who) => Complaint.create([
    {
        author: who.student._id, title: 'Drinking water cooler on the second floor is broken',
        description: 'The cooler near room 204 has not worked for two weeks. Students walk to the ground floor between lectures.',
        votes: [up(who.aarav), up(who.diya), up(who.kabir), up(who.faculty)], createdAt: fromNow(-6), isDemo: true,
    },
    {
        author: who.aarav._id, title: 'Library closes before evening lectures end',
        description: 'The library shuts at 5 pm while lectures run until 5:30. A closing time of 7 pm would let day scholars use it.',
        votes: [up(who.student), up(who.meera), down(who.vihaan)], createdAt: fromNow(-5), isDemo: true,
    },
    {
        // anonymous, with one of the two reveal votes it needs
        author: who.kabir._id, isAnonymous: true, title: 'Internal marks changed without explanation',
        description: 'Marks for the second internal test were lowered after being displayed. No reason was given to the class.',
        votes: [up(who.student), up(who.aarav), up(who.diya)], revealVotes: [who.sunita._id], createdAt: fromNow(-4), isDemo: true,
    },
    {
        author: who.ananya._id, isAnonymous: true, title: 'Hostel mess serves dinner cold',
        description: 'Dinner is cooked at 6 pm and served at 8 pm without reheating. This has been raised with the warden twice.',
        votes: [up(who.vihaan), up(who.meera)], createdAt: fromNow(-3), isDemo: true,
    },
    {
        author: who.diya._id, title: 'Projector in the seminar hall flickers',
        description: 'The projector loses signal every few minutes, which interrupts presentations.',
        votes: [up(who.student)], createdAt: fromNow(-9), status: 'resolved',
        resolution: { note: 'The cable was replaced and the projector was serviced.', by: who.admin._id, at: fromNow(-7) }, isDemo: true,
    },
    {
        author: who.vihaan._id, title: 'No parking space for bicycles',
        description: 'Bicycles are left along the main gate wall. A covered stand near the IT block would help.',
        votes: [up(who.ananya), down(who.kabir)], createdAt: fromNow(-1), isDemo: true,
    },
]);

const buildBookings = async (who) => {
    const [hall, lab, auditorium] = await Facility.create([
        { name: 'Seminar Hall', description: 'Seats 120, projector and sound system.', location: 'Block A, first floor', createdBy: who.admin._id, isDemo: true },
        { name: 'Computer Lab 2', description: '40 machines, for workshops and contests.', location: 'Block C, second floor', createdBy: who.admin._id, isDemo: true },
        { name: 'Auditorium', description: 'Seats 500, stage and green room.', location: 'Main building', createdBy: who.admin._id, isDemo: true },
        { name: 'Basketball Court', description: 'Outdoor court with floodlights.', location: 'Sports ground', available: false, createdBy: who.admin._id, isDemo: true },
    ]);

    const decided = (status, extra = {}) => ({ status, decidedBy: who.admin._id, decidedAt: fromNow(-1), ...extra });

    await Booking.create([
        { facility: hall._id, user: who.student._id, date: dayFromNow(2), startTime: '10:00', endTime: '12:00', purpose: 'Coding club orientation', isDemo: true },
        { facility: hall._id, user: who.faculty._id, date: dayFromNow(3), startTime: '14:00', endTime: '16:00', purpose: 'Guest lecture on databases', ...decided('approved'), isDemo: true },
        { facility: lab._id, user: who.aarav._id, date: dayFromNow(4), startTime: '09:00', endTime: '13:00', purpose: 'Inter-class programming contest', isDemo: true },
        { facility: lab._id, user: who.diya._id, date: dayFromNow(1), startTime: '15:00', endTime: '17:00', purpose: 'Web development workshop', ...decided('approved'), isDemo: true },
        { facility: auditorium._id, user: who.vihaan._id, date: dayFromNow(6), startTime: '17:00', endTime: '20:00', purpose: 'Rehearsal for the annual day', ...decided('rejected', { reason: 'The auditorium is being repainted that week.' }), isDemo: true },
        { facility: auditorium._id, user: who.sunita._id, date: dayFromNow(10), startTime: '10:00', endTime: '13:00', purpose: 'Department orientation for first-year students', isDemo: true },
    ]);
};

const buildApplications = (who) => {
    const remark = (by, comment, days) => ({ comment, by: by._id, at: fromNow(days) });

    return Application.create([
        { submittedBy: who.student._id, category: 'event', title: 'Two-day hackathon in the Computer department', description: 'A 24-hour hackathon for second and third-year students, with problem statements from local companies.', createdAt: fromNow(-2), isDemo: true },
        { submittedBy: who.aarav._id, category: 'budget', title: 'Budget for the robotics club', description: 'Funds for motor drivers, sensors and two development boards for the inter-college competition.', review: remark(who.faculty, 'The list is reasonable. The club should reuse last year\'s chassis.', -2), createdAt: fromNow(-4), isDemo: true },
        { submittedBy: who.diya._id, category: 'sponsorship', title: 'Sponsorship for the annual technical festival', description: 'Permission to approach three companies for sponsorship in return for stalls at the festival.', review: remark(who.sunita, 'Supported, provided the stalls stay outside the lecture blocks.', -8), status: 'approved', decision: remark(who.admin, 'Approved. Share the agreements with the office before signing.', -6), createdAt: fromNow(-10), isDemo: true },
        { submittedBy: who.kabir._id, category: 'event', title: 'Overnight film screening on the ground', description: 'An open-air screening for the hostel students on the last Saturday of the month.', status: 'rejected', decision: remark(who.admin, 'The ground is not available overnight. Please propose an evening slot.', -5), createdAt: fromNow(-7), isDemo: true },
        { submittedBy: who.ananya._id, category: 'event', title: 'Inter-department badminton tournament', description: 'A weekend tournament in the indoor hall, with teams from every department.', createdAt: fromNow(-1), isDemo: true },
        { submittedBy: who.vihaan._id, category: 'budget', title: 'Books for the IT department library', description: 'Twenty titles on cloud computing and security requested by the third-year class.', status: 'approved', decision: remark(who.admin, 'Approved from the library fund.', -12), createdAt: fromNow(-15), isDemo: true },
    ]);
};

// "who" maps a short name to the sample account, for example who.student or who.aarav
const buildSampleContent = async (who) => {
    await buildElections(who);
    await buildComplaints(who);
    await buildBookings(who);
    await buildApplications(who);
};

export { removeSampleContent, buildSampleContent }

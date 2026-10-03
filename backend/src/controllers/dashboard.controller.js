import asyncHandler from '../utils/asynchandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { Notice } from '../models/notice.model.js';
import { Election } from '../models/election.model.js';
import { Candidate } from '../models/candidate.model.js';
import { Vote } from '../models/vote.model.js';
import { Complaint } from '../models/complaint.model.js';
import { Booking } from '../models/booking.model.js';
import { Application } from '../models/application.model.js';
import { isEligible, stageOf } from '../utils/electionStage.js';

// A card is one figure on the dashboard: { key, label, value, link }.
const card = (key, label, value, link) => ({ key, label, value, link });

// Demo staff decide about sample data only, so their figures count sample data only
const reachOf = (user) => (user.isDemo ? { isDemo: true } : {});

const myPendingBookings = async (user) =>
    card('myPendingBookings', 'Your booking requests waiting', await Booking.countDocuments({ user: user._id, status: 'pending' }), '/facility');

const studentCards = async (user) => {
    // elections in their voting stage that this student may vote in and has not voted in yet
    const underway = await Election.find({ endedAt: null, applicationDeadline: { $lte: new Date() } });
    const open = underway.filter((election) => stageOf(election) === 'voting' && isEligible(election, user));
    const voted = await Vote.find({ voter: user._id, election: { $in: open.map((election) => election._id) } }).distinct('election');

    return [
        card('openElections', 'Elections waiting for your vote', open.length - voted.length, '/election'),
        await myPendingBookings(user),
        card('myPendingApplications', 'Your applications waiting', await Application.countDocuments({ submittedBy: user._id, status: 'pending' }), '/application-page'),
    ];
};

const facultyCards = async (user) => {
    const reach = reachOf(user);

    const cards = [
        card('applicationsToReview', 'Applications waiting for a review', await Application.countDocuments({ ...reach, status: 'pending', 'review.at': null }), '/application-page'),
        await myPendingBookings(user),
    ];

    if (user.isBoardMember) {
        const waiting = await Complaint.countDocuments({ ...reach, isAnonymous: true, revealedAt: null, revealVotes: { $ne: user._id } });
        cards.push(card('complaintsToReveal', 'Anonymous complaints you have not voted on', waiting, '/complaints'));
    }

    return cards;
};

const adminCards = async (user) => {
    const reach = reachOf(user);
    const elections = await Election.find(reach).distinct('_id');

    const [pendingProfiles, students, faculty, pendingCandidates, pendingBookings, pendingApplications, openComplaints] = await Promise.all([
        User.countDocuments({ ...reach, profileStatus: 'Pending', role: { $in: ['student', 'faculty'] } }),
        User.countDocuments({ ...reach, role: 'student', profileStatus: 'Approved' }),
        User.countDocuments({ ...reach, role: 'faculty', profileStatus: 'Approved' }),
        Candidate.countDocuments({ election: { $in: elections }, status: 'Pending' }),
        Booking.countDocuments({ ...reach, status: 'pending' }),
        Application.countDocuments({ ...reach, status: 'pending' }),
        Complaint.countDocuments({ ...reach, status: 'open' }),
    ]);

    return [
        card('pendingProfiles', 'Profiles waiting for approval', pendingProfiles, '/pending-request'),
        card('pendingCandidates', 'Candidates waiting for approval', pendingCandidates, '/election'),
        card('pendingBookings', 'Booking requests waiting', pendingBookings, '/facility'),
        card('pendingApplications', 'Applications waiting for a decision', pendingApplications, '/application-page'),
        card('openComplaints', 'Open complaints', openComplaints, '/complaints'),
        card('students', 'Approved students', students, '/pending-request'),
        card('faculty', 'Approved faculty', faculty, '/pending-request'),
    ];
};

const CARDS_FOR = { student: studentCards, faculty: facultyCards, admin: adminCards };

const getDashboard = asyncHandler(async (req, res) => {
    const unreadNotices = await Notice.countDocuments({ user: req.user._id, readAt: null });
    const build = CARDS_FOR[req.user.role];

    const cards = [
        ...(build ? await build(req.user) : []),
        card('unreadNotices', 'Unread notices', unreadNotices, '/'),
    ];

    return res.status(200).json(
        new ApiResponse(200, { role: req.user.role, unreadNotices, cards }, "Dashboard")
    );
});

export { getDashboard }

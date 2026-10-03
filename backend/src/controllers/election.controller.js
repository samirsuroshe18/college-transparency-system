import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Election } from '../models/election.model.js';
import { Candidate } from '../models/candidate.model.js';
import { Vote } from '../models/vote.model.js';
import { endOfDay, isEligible, stageOf } from '../utils/electionStage.js';
import { readChoice, readDate, readText } from '../utils/input.js';
import { assertReach } from '../utils/reach.js';
import { notify } from '../utils/notices.js';
import { isValidObjectId } from '../utils/objectId.js';

const DUPLICATE_KEY = 11000;
const TITLE_MAX = 120;
const TEXT_MAX = 2000;
const LIST_LIMIT = 200;

// what is shown of the student behind a candidacy
const STUDENT_FIELDS = 'name department currentYear classDivision rollNumber';

const withStage = (election) => ({ ...election.toObject(), stage: stageOf(election) });

const findElection = async (id) => {
    const election = isValidObjectId(id) ? await Election.findById(id) : null;

    if (!election) {
        throw new ApiError(404, "Election not found");
    }

    return election;
};

// eligibility arrives as an object of optional texts; rules left empty are not stored
const readEligibility = (value) => {
    const rules = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const eligibility = {};

    for (const [key, label] of [['department', 'Department'], ['year', 'Year'], ['division', 'Division']]) {
        const text = readText(rules[key], label);
        if (text) eligibility[key] = text;
    }

    return eligibility;
};

const createElection = asyncHandler(async (req, res) => {
    const title = readText(req.body.title, 'Title', { max: TITLE_MAX, required: true });
    const description = readText(req.body.description, 'Description', { max: TEXT_MAX });
    const applicationDeadline = readDate(req.body.applicationDeadline, 'Application deadline', { required: true });
    const votingDay = readDate(req.body.votingDay, 'Voting day', { required: true });
    const eligibility = readEligibility(req.body.eligibility);

    if (applicationDeadline >= endOfDay(votingDay)) {
        throw new ApiError(400, "The application deadline must be before the voting day");
    }

    if (endOfDay(votingDay) < new Date()) {
        throw new ApiError(400, "The voting day cannot be in the past");
    }

    const election = await Election.create({
        title,
        description,
        applicationDeadline,
        votingDay,
        eligibility,
        createdBy: req.user._id,
        isDemo: req.user.isDemo,
    });

    return res.status(201).json(
        new ApiResponse(201, { election: withStage(election) }, "Election created")
    );
});

const listElections = asyncHandler(async (req, res) => {
    const elections = await Election.find().sort({ votingDay: -1 }).limit(LIST_LIMIT);

    const counts = await Candidate.aggregate([
        { $match: { status: 'Approved' } },
        { $group: { _id: '$election', count: { $sum: 1 } } },
    ]);
    const countOf = new Map(counts.map((row) => [String(row._id), row.count]));

    return res.status(200).json(
        new ApiResponse(200, {
            elections: elections.map((election) => ({
                ...withStage(election),
                candidateCount: countOf.get(String(election._id)) || 0,
                eligible: isEligible(election, req.user),
            })),
        }, "Elections")
    );
});

// How many votes each candidate of an election has. The votes themselves are counted
// every time, so the figure cannot drift away from them.
const countVotes = async (electionId) => {
    const rows = await Vote.aggregate([
        { $match: { election: electionId } },
        { $group: { _id: '$candidate', count: { $sum: 1 } } },
    ]);

    return new Map(rows.map((row) => [String(row._id), row.count]));
};

// a candidacy as it is sent; counts stay hidden until voting has begun
const present = (candidate, votes) => ({ ...candidate.toObject(), votes });

const getElection = asyncHandler(async (req, res) => {
    const election = await findElection(req.params.id);
    const stage = stageOf(election);
    const showVotes = stage !== 'applications';
    const isAdmin = req.user.role === 'admin';

    const all = await Candidate.find({ election: election._id })
        .populate('student', STUDENT_FIELDS)
        .sort({ createdAt: 1 });

    const approved = all.filter((candidate) => candidate.status === 'Approved');
    const mine = all.find((candidate) => String(candidate.student?._id) === String(req.user._id));

    const counts = showVotes ? await countVotes(election._id) : new Map();
    const votesOf = (candidate) => counts.get(String(candidate._id)) || 0;

    // the winner is settled only once the election is closed; a tie names everyone tied
    const highest = Math.max(0, ...approved.map(votesOf));
    const winners = stage === 'closed' && highest > 0
        ? approved.filter((candidate) => votesOf(candidate) === highest)
        : [];

    const hasVoted = Boolean(await Vote.exists({ election: election._id, voter: req.user._id }));

    return res.status(200).json(
        new ApiResponse(200, {
            election: { ...election.toObject(), stage },
            candidates: (isAdmin ? all : approved).map((candidate) => present(candidate, votesOf(candidate))),
            myCandidacy: mine ? present(mine, votesOf(mine)) : null,
            winners: winners.map((candidate) => present(candidate, votesOf(candidate))),
            eligible: isEligible(election, req.user),
            hasVoted,
        }, "Election")
    );
});

const endElection = asyncHandler(async (req, res) => {
    const election = await findElection(req.params.id);
    assertReach(req.user, election);

    if (stageOf(election) === 'closed') {
        throw new ApiError(409, "This election is already closed");
    }

    election.endedAt = new Date();
    election.endedBy = req.user._id;
    await election.save();

    return res.status(200).json(
        new ApiResponse(200, { election: withStage(election) }, "Election ended")
    );
});

const applyAsCandidate = asyncHandler(async (req, res) => {
    const election = await findElection(req.params.id);
    assertReach(req.user, election);

    if (!isEligible(election, req.user)) {
        throw new ApiError(403, "You are not eligible for this election");
    }

    if (stageOf(election) !== 'applications') {
        throw new ApiError(409, "Applications are closed");
    }

    const agenda = readText(req.body.agenda, 'Agenda', { max: TEXT_MAX, required: true });
    const experience = readText(req.body.experience, 'Experience', { max: TEXT_MAX });

    let candidate;
    try {
        candidate = await Candidate.create({ election: election._id, student: req.user._id, agenda, experience });
    } catch (error) {
        // the unique index decides when the same student applies twice at once
        if (error.code === DUPLICATE_KEY) {
            throw new ApiError(409, "You have already applied");
        }
        throw error;
    }

    return res.status(201).json(
        new ApiResponse(201, { candidate }, "Application submitted. An admin will review it.")
    );
});

const decideCandidate = asyncHandler(async (req, res) => {
    const election = await findElection(req.params.id);
    assertReach(req.user, election);

    const { candidateId } = req.params;
    const candidate = isValidObjectId(candidateId)
        ? await Candidate.findOne({ _id: candidateId, election: election._id })
        : null;

    if (!candidate) {
        throw new ApiError(404, "Candidate not found");
    }

    if (stageOf(election) === 'closed') {
        throw new ApiError(409, "This election is already closed");
    }

    const status = readChoice(req.body.status, 'Status', ['Approved', 'Rejected'], { required: true });

    if (candidate.status === status) {
        throw new ApiError(409, `This candidacy is already ${status.toLowerCase()}`);
    }

    // students may already have voted for an approved candidate; taking the candidate
    // out now would leave those votes with nobody
    if (stageOf(election) === 'voting' && candidate.status === 'Approved') {
        throw new ApiError(409, "A candidate cannot be rejected once voting has started");
    }

    candidate.status = status;
    candidate.decidedBy = req.user._id;
    await candidate.save();

    await notify(candidate.student, {
        type: 'election',
        title: `Your candidacy was ${status.toLowerCase()}`,
        body: election.title,
        link: '/election',
    });

    return res.status(200).json(
        new ApiResponse(200, { candidate }, `Candidacy ${status.toLowerCase()}`)
    );
});

const castVote = asyncHandler(async (req, res) => {
    const election = await findElection(req.params.id);
    assertReach(req.user, election);

    if (!isEligible(election, req.user)) {
        throw new ApiError(403, "You are not eligible for this election");
    }

    if (stageOf(election) !== 'voting') {
        throw new ApiError(409, "Voting is not open");
    }

    const { candidateId } = req.body;
    const candidate = isValidObjectId(candidateId)
        ? await Candidate.findOne({ _id: candidateId, election: election._id, status: 'Approved' })
        : null;

    if (!candidate) {
        throw new ApiError(400, "Choose an approved candidate of this election");
    }

    try {
        await Vote.create({ election: election._id, voter: req.user._id, candidate: candidate._id });
    } catch (error) {
        // one vote per student: the unique index refuses the second, however close together they arrive
        if (error.code === DUPLICATE_KEY) {
            throw new ApiError(409, "You have already voted");
        }
        throw error;
    }

    return res.status(201).json(
        new ApiResponse(201, {}, "Your vote has been recorded")
    );
});

export {
    createElection,
    listElections,
    getElection,
    endElection,
    applyAsCandidate,
    decideCandidate,
    castVote
}

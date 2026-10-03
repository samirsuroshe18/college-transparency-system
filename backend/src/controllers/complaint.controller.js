import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Complaint } from '../models/complaint.model.js';
import { User } from '../models/user.model.js';
import { offensiveWord } from '../utils/language.js';
import { readBoolean, readChoice, readText } from '../utils/input.js';
import { assertReach } from '../utils/reach.js';
import { attach, attachmentNote } from '../utils/attachments.js';
import { notify } from '../utils/notices.js';
import { isValidObjectId } from '../utils/objectId.js';

const TITLE_MAX = 120;
const TEXT_MAX = 2000;
const NOTE_MAX = 500;
const LIST_LIMIT = 200;

const VOTE_VALUES = { up: 1, down: -1 };
const VOTE_NAMES = { 1: 'up', '-1': 'down' };

const isBoardMember = (user) => user.role === 'faculty' && user.isBoardMember === true;
const seesRevealFigures = (user) => isBoardMember(user) || user.role === 'admin';

// The board that decides about a complaint: approved faculty marked as board members.
// The sample college has a board of its own, so its public accounts never decide
// about a real complaint, and are not counted for one.
const boardOf = async (isDemo) => {
    const ids = await User.find({
        role: 'faculty',
        isBoardMember: true,
        profileStatus: 'Approved',
        isDemo: Boolean(isDemo),
    }).distinct('_id');

    return new Set(ids.map(String));
};

// Only votes of people who are on the board now count: someone who has left the board
// since voting no longer decides, and the number needed follows the board as it is.
const countedRevealVotes = (complaint, board) => (complaint.revealVotes || []).filter((id) => board.has(String(id))).length;

// more than half of the board
const votesNeeded = (size) => Math.floor(size / 2) + 1;

const isRevealed = (complaint) => !complaint.isAnonymous || Boolean(complaint.revealedAt);

// A complaint as one viewer may see it. This is the only place a complaint is turned
// into an answer, so an anonymous author cannot slip out through another route.
const present = (complaint, viewer, board) => {
    const authorId = String(complaint.author?._id || complaint.author);
    const votes = complaint.votes || [];
    const mine = votes.find((vote) => String(vote.user) === String(viewer._id));

    const view = {
        _id: complaint._id,
        title: complaint.title,
        description: complaint.description,
        documentUrl: complaint.documentUrl,
        isAnonymous: complaint.isAnonymous,
        revealed: complaint.isAnonymous && Boolean(complaint.revealedAt),
        author: isRevealed(complaint) && complaint.author?.name
            ? { _id: complaint.author._id, name: complaint.author.name, department: complaint.author.department }
            : null,
        mine: authorId === String(viewer._id),
        upvotes: votes.filter((vote) => vote.value === 1).length,
        downvotes: votes.filter((vote) => vote.value === -1).length,
        myVote: mine ? VOTE_NAMES[mine.value] : null,
        status: complaint.status,
        resolution: complaint.resolution?.at
            ? { note: complaint.resolution.note, at: complaint.resolution.at, by: complaint.resolution.by?.name ? { name: complaint.resolution.by.name } : null }
            : null,
        isDemo: complaint.isDemo,
        createdAt: complaint.createdAt,
    };

    if (seesRevealFigures(viewer) && complaint.isAnonymous) {
        const members = board[complaint.isDemo ? 'demo' : 'real'];
        view.revealVotes = countedRevealVotes(complaint, members);
        view.revealNeeded = votesNeeded(members.size);
        view.myRevealVote = (complaint.revealVotes || []).some((id) => String(id) === String(viewer._id));
    }

    return view;
};

const boards = async () => {
    const [real, demo] = await Promise.all([boardOf(false), boardOf(true)]);
    return { real, demo };
};

const withPeople = (query) => query.populate('author', 'name department').populate('resolution.by', 'name');

const findComplaint = async (id) => {
    const complaint = isValidObjectId(id) ? await Complaint.findById(id) : null;

    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    return complaint;
};

// the complaint as it is now, ready to be sent to this viewer
const answerFor = async (id, viewer) => {
    const [complaint, board] = await Promise.all([withPeople(Complaint.findById(id)), boards()]);
    return present(complaint, viewer, board);
};

const listComplaints = asyncHandler(async (req, res) => {
    const [complaints, board] = await Promise.all([
        withPeople(Complaint.find()).sort({ createdAt: -1 }).limit(LIST_LIMIT),
        boards(),
    ]);

    return res.status(200).json(
        new ApiResponse(200, { complaints: complaints.map((complaint) => present(complaint, req.user, board)) }, "Complaints")
    );
});

const submitComplaint = asyncHandler(async (req, res) => {
    const title = readText(req.body.title, 'Title', { max: TITLE_MAX, required: true });
    const description = readText(req.body.description, 'Description', { max: TEXT_MAX, required: true });

    // the word is named, so the student knows what to change
    const offensive = offensiveWord(title) || offensiveWord(description);
    if (offensive) {
        throw new ApiError(400, `Please remove offensive language: "${offensive}"`);
    }

    const complaint = await Complaint.create({
        author: req.user._id,
        title,
        description,
        isAnonymous: readBoolean(req.body.isAnonymous),
        isDemo: req.user.isDemo,
    });

    // the file is stored only once the complaint itself has been accepted
    const { url, problem } = await attach(req, 'complaints');
    if (url) {
        complaint.documentUrl = url;
        await complaint.save();
    }

    return res.status(201).json(
        new ApiResponse(201, { complaint: await answerFor(complaint._id, req.user) }, `Complaint submitted${attachmentNote(problem)}`)
    );
});

const voteOnComplaint = asyncHandler(async (req, res) => {
    const complaint = await findComplaint(req.params.id);
    assertReach(req.user, complaint);

    const value = readChoice(req.body.value, 'Value', ['up', 'down', 'none'], { required: true });

    // The old vote is taken out and the new one put in as two steps the database
    // applies one at a time, so votes of different users arriving together are all kept.
    await Complaint.updateOne({ _id: complaint._id }, { $pull: { votes: { user: req.user._id } } });

    if (value !== 'none') {
        await Complaint.updateOne(
            { _id: complaint._id, 'votes.user': { $ne: req.user._id } },
            { $push: { votes: { user: req.user._id, value: VOTE_VALUES[value] } } }
        );
    }

    return res.status(200).json(
        new ApiResponse(200, { complaint: await answerFor(complaint._id, req.user) }, "Vote recorded")
    );
});

const voteToReveal = asyncHandler(async (req, res) => {
    if (!isBoardMember(req.user)) {
        throw new ApiError(403, "Only board members can vote to reveal");
    }

    const complaint = await findComplaint(req.params.id);
    assertReach(req.user, complaint);

    if (isRevealed(complaint)) {
        throw new ApiError(409, "There is nothing to reveal");
    }

    // counted once per member, however often or quickly it is sent
    const added = await Complaint.updateOne(
        { _id: complaint._id, revealVotes: { $ne: req.user._id } },
        { $addToSet: { revealVotes: req.user._id } }
    );

    if (added.modifiedCount === 0) {
        throw new ApiError(409, "You have already voted to reveal");
    }

    const [latest, board] = await Promise.all([Complaint.findById(complaint._id), boardOf(complaint.isDemo)]);

    if (countedRevealVotes(latest, board) >= votesNeeded(board.size)) {
        // the filter makes sure the author is told once, even when two last votes arrive together
        const revealed = await Complaint.updateOne({ _id: complaint._id, revealedAt: null }, { $set: { revealedAt: new Date() } });

        if (revealed.modifiedCount === 1) {
            await notify(complaint.author, {
                type: 'complaint',
                title: 'Your name on a complaint was revealed',
                body: complaint.title,
                link: '/complaints',
            });
        }
    }

    return res.status(200).json(
        new ApiResponse(200, { complaint: await answerFor(complaint._id, req.user) }, "Vote to reveal recorded")
    );
});

const resolveComplaint = asyncHandler(async (req, res) => {
    const complaint = await findComplaint(req.params.id);
    assertReach(req.user, complaint);

    const note = readText(req.body.note, 'Note', { max: NOTE_MAX, required: true });

    const resolved = await Complaint.updateOne(
        { _id: complaint._id, status: 'open' },
        { $set: { status: 'resolved', resolution: { note, by: req.user._id, at: new Date() } } }
    );

    if (resolved.modifiedCount === 0) {
        throw new ApiError(409, "This complaint is already resolved");
    }

    await notify(complaint.author, {
        type: 'complaint',
        title: 'Your complaint was resolved',
        body: complaint.title,
        link: '/complaints',
    });

    return res.status(200).json(
        new ApiResponse(200, { complaint: await answerFor(complaint._id, req.user) }, "Complaint resolved")
    );
});

export {
    listComplaints,
    submitComplaint,
    voteOnComplaint,
    voteToReveal,
    resolveComplaint
}

import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Application, APPLICATION_CATEGORIES } from '../models/application.model.js';
import { User } from '../models/user.model.js';
import { readChoice, readText } from '../utils/input.js';
import { assertReach } from '../utils/reach.js';
import { attach, attachmentNote } from '../utils/attachments.js';
import { notify } from '../utils/notices.js';
import { sendMail } from '../utils/mailSender.js';
import { isValidObjectId } from '../utils/objectId.js';

const TITLE_MAX = 120;
const TEXT_MAX = 2000;
const COMMENT_MAX = 500;
const LIST_LIMIT = 300;

const ALREADY_DECIDED = "This application has already been decided";

const withPeople = (query) => query
    .populate('submittedBy', 'name department currentYear')
    .populate('review.by', 'name')
    .populate('decision.by', 'name');

const present = (application, viewer) => ({
    ...application.toObject(),
    mine: String(application.submittedBy?._id || application.submittedBy) === String(viewer._id),
});

const findApplication = async (id) => {
    const application = isValidObjectId(id) ? await Application.findById(id) : null;

    if (!application) {
        throw new ApiError(404, "Application not found");
    }

    return application;
};

const answerFor = async (id, viewer) => present(await withPeople(Application.findById(id)), viewer);

const listApplications = asyncHandler(async (req, res) => {
    const filter = req.query.mine === 'true' ? { submittedBy: req.user._id } : {};

    const applications = await withPeople(Application.find(filter)).sort({ createdAt: -1 }).limit(LIST_LIMIT);

    return res.status(200).json(
        new ApiResponse(200, { applications: applications.map((application) => present(application, req.user)) }, "Applications")
    );
});

const submitApplication = asyncHandler(async (req, res) => {
    // status, review and decision are never read from the form
    const application = await Application.create({
        title: readText(req.body.title, 'Title', { max: TITLE_MAX, required: true }),
        description: readText(req.body.description, 'Description', { max: TEXT_MAX, required: true }),
        category: readChoice(req.body.category, 'Category', APPLICATION_CATEGORIES, { required: true }),
        submittedBy: req.user._id,
        isDemo: req.user.isDemo,
    });

    // the file is stored only once the application itself has been accepted
    const { url, problem } = await attach(req, 'applications');
    if (url) {
        application.fileUrl = url;
        await application.save();
    }

    return res.status(201).json(
        new ApiResponse(201, { application: await answerFor(application._id, req.user) }, `Application submitted${attachmentNote(problem)}`)
    );
});

const reviewApplication = asyncHandler(async (req, res) => {
    const application = await findApplication(req.params.id);
    assertReach(req.user, application);

    const comment = readText(req.body.comment, 'Comment', { max: COMMENT_MAX, required: true });

    const reviewed = await Application.updateOne(
        { _id: application._id, status: 'pending' },
        { $set: { review: { comment, by: req.user._id, at: new Date() } } }
    );

    if (reviewed.matchedCount === 0) {
        throw new ApiError(409, ALREADY_DECIDED);
    }

    return res.status(200).json(
        new ApiResponse(200, { application: await answerFor(application._id, req.user) }, "Review saved")
    );
});

const decideApplication = asyncHandler(async (req, res) => {
    const application = await findApplication(req.params.id);
    assertReach(req.user, application);

    const status = readChoice(req.body.status, 'Status', ['approved', 'rejected'], { required: true });
    const comment = readText(req.body.comment, 'Comment', { max: COMMENT_MAX });

    if (status === 'rejected' && !comment) {
        throw new ApiError(400, "A comment is required to reject");
    }

    // the filter lets one decision through, however many arrive together
    const decided = await Application.updateOne(
        { _id: application._id, status: 'pending' },
        { $set: { status, decision: { comment, by: req.user._id, at: new Date() } } }
    );

    if (decided.modifiedCount === 0) {
        throw new ApiError(409, ALREADY_DECIDED);
    }

    const title = `Your application was ${status}`;

    await notify(application.submittedBy, { type: 'application', title, body: application.title, link: '/application-page' });

    // sample accounts have no mailbox
    const applicant = await User.findById(application.submittedBy).select('email isDemo');
    if (applicant && !applicant.isDemo) {
        const lines = [`Your application "${application.title}" was ${status}.`];
        if (comment) lines.push(`Comment: ${comment}`);
        await sendMail(applicant.email, title, lines.join('\n'));
    }

    return res.status(200).json(
        new ApiResponse(200, { application: await answerFor(application._id, req.user) }, `Application ${status}`)
    );
});

export { listApplications, submitApplication, reviewApplication, decideApplication }

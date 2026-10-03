import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HealthConcern, URGENCIES } from '../models/healthConcern.model.js';
import { User } from '../models/user.model.js';
import { readChoice, readText } from '../utils/input.js';
import { assertReach } from '../utils/reach.js';
import { attach, attachmentNote } from '../utils/attachments.js';
import { notify, notifyMany } from '../utils/notices.js';
import { sendMail } from '../utils/mailSender.js';
import { collegeToday, collegeDayFromNow } from '../utils/collegeTime.js';
import { isValidObjectId } from '../utils/objectId.js';

const SYMPTOMS_MAX = 300;
const TEXT_MAX = 2000;
const MAX_LEAVE_DAYS = 30;
const LIST_LIMIT = 300;

const NOT_ALLOWED = "You are not allowed to do this";

const withPeople = (query) => query
    .populate('student', 'name rollNumber department currentYear classDivision')
    .populate('assessment.by', 'name');

// the demo accounts are public, so they are shown the sample college only
const withinReach = (actor) => (actor.isDemo ? { isDemo: true } : {});

const isCoordinator = (user) => user.role === 'faculty' && Boolean(user.coordinatorOf?.department);

// urgent open concerns first, then the other open ones, then what is already assessed
const rankOf = (concern) => (concern.status === 'open' ? (concern.urgency === 'urgent' ? 0 : 1) : 2);

const listConcerns = asyncHandler(async (req, res) => {
    const { role } = req.user;

    if (role !== 'student' && role !== 'doctor') {
        throw new ApiError(403, NOT_ALLOWED);
    }

    const filter = role === 'student' ? { student: req.user._id } : withinReach(req.user);
    const concerns = await withPeople(HealthConcern.find(filter)).sort({ createdAt: -1 }).limit(LIST_LIMIT);

    if (role === 'doctor') {
        // the sort is stable, so the newest stays first inside each group
        concerns.sort((a, b) => rankOf(a) - rankOf(b));
    }

    return res.status(200).json(
        new ApiResponse(200, { concerns }, "Health concerns")
    );
});

const reportConcern = asyncHandler(async (req, res) => {
    const symptoms = readText(req.body.symptoms, 'Symptoms', { max: SYMPTOMS_MAX, required: true });
    const description = readText(req.body.description, 'Description', { max: TEXT_MAX });
    const urgency = readChoice(req.body.urgency, 'Urgency', URGENCIES) || 'normal';

    // status, assessment and leave are never read from the form
    const concern = await HealthConcern.create({
        student: req.user._id,
        symptoms,
        description,
        urgency,
        isDemo: req.user.isDemo,
    });

    // the file is stored only once the concern itself has been accepted
    const { url, problem } = await attach(req, 'health');
    if (url) {
        concern.attachmentUrl = url;
        await concern.save();
    }

    return res.status(201).json(
        new ApiResponse(201, { concern: await withPeople(HealthConcern.findById(concern._id)) }, `Health concern submitted${attachmentNote(problem)}`)
    );
});

// a whole number of days, sent as a number or as a form's text of one
const readLeaveDays = (value) => {
    const text = typeof value === 'number' ? String(value) : (typeof value === 'string' ? value.trim() : '');
    const days = /^\d{1,2}$/.test(text) ? Number(text) : NaN;

    if (!Number.isInteger(days) || days > MAX_LEAVE_DAYS) {
        throw new ApiError(400, `Leave days must be a whole number from 0 to ${MAX_LEAVE_DAYS}`);
    }

    return days;
};

const dayCount = (days) => `${days} ${days === 1 ? 'day' : 'days'}`;

// the faculty who look after the student's class, in the same college (sample or real)
const coordinatorsOf = (student) => {
    if (!student.department || !student.currentYear || !student.classDivision) return [];

    return User.find({
        role: 'faculty',
        profileStatus: 'Approved',
        isDemo: student.isDemo,
        'coordinatorOf.department': student.department,
        'coordinatorOf.year': student.currentYear,
        'coordinatorOf.division': student.classDivision,
    }).select('email isDemo');
};

// Tells the student and the class coordinators about a leave. The coordinators learn
// who is away and for which days, and nothing about the illness.
const announceLeave = async (student, { days, from, until }) => {
    const period = `${from} to ${until}`;
    const coordinators = await coordinatorsOf(student);

    await notify(student._id, {
        type: 'health',
        title: `You were given ${dayCount(days)} of medical leave`,
        body: period,
        link: '/health',
    });

    if (coordinators.length > 0) {
        await notifyMany(coordinators.map((coordinator) => coordinator._id), {
            type: 'leave',
            title: `${student.name} is on medical leave`,
            body: period,
            link: '/health',
        });
    }

    const mails = [];

    if (!student.isDemo) {
        mails.push(sendMail(student.email, 'Medical leave granted', `You were given ${dayCount(days)} of medical leave, from ${period}.`));
    }

    for (const coordinator of coordinators.filter((one) => !one.isDemo)) {
        const who = student.rollNumber ? `${student.name} (${student.rollNumber})` : student.name;
        mails.push(sendMail(coordinator.email, 'A student of your class is on medical leave', `${who} is on medical leave from ${period}.`));
    }

    // a mail that cannot be sent never undoes the assessment
    await Promise.allSettled(mails);
};

const assessConcern = asyncHandler(async (req, res) => {
    const concern = isValidObjectId(req.params.id) ? await HealthConcern.findById(req.params.id) : null;

    if (!concern) {
        throw new ApiError(404, "Health concern not found");
    }

    assertReach(req.user, concern);

    const leaveDays = readLeaveDays(req.body.leaveDays);
    const diagnosis = readText(req.body.diagnosis, 'Diagnosis', { max: TEXT_MAX, required: true });

    const changes = {
        status: 'assessed',
        assessment: { diagnosis, leaveDays, by: req.user._id, at: new Date() },
    };

    if (leaveDays > 0) {
        // the leave starts today and counts today
        changes.leaveFrom = collegeToday();
        changes.leaveUntil = collegeDayFromNow(leaveDays - 1);
    }

    // the filter lets one assessment through, however many arrive together
    const assessed = await HealthConcern.updateOne({ _id: concern._id, status: 'open' }, { $set: changes });

    if (assessed.modifiedCount === 0) {
        throw new ApiError(409, "This concern has already been assessed");
    }

    const student = await User.findById(concern.student);

    if (student && leaveDays > 0) {
        await announceLeave(student, { days: leaveDays, from: changes.leaveFrom, until: changes.leaveUntil });
    } else if (student) {
        await notify(student._id, {
            type: 'health',
            title: 'Your health concern was assessed',
            body: 'No leave was given.',
            link: '/health',
        });
    }

    return res.status(200).json(
        new ApiResponse(200, { concern: await withPeople(HealthConcern.findById(concern._id)) }, "Concern assessed")
    );
});

// whose leaves the viewer may see
const leaveFilterFor = async (viewer) => {
    if (viewer.role === 'student') return { student: viewer._id };

    if (viewer.role === 'doctor') return withinReach(viewer);

    if (isCoordinator(viewer)) {
        const { department, year, division } = viewer.coordinatorOf;
        const students = await User.find({
            role: 'student',
            profileStatus: 'Approved',
            department,
            currentYear: year,
            classDivision: division,
            ...withinReach(viewer),
        }).select('_id');

        return { student: { $in: students.map((student) => student._id) } };
    }

    throw new ApiError(403, NOT_ALLOWED);
};

// A leave is the part of a concern that is not medical: who is away, and for which days.
const listLeaves = asyncHandler(async (req, res) => {
    const filter = await leaveFilterFor(req.user);

    const concerns = await HealthConcern.find({ ...filter, status: 'assessed', 'assessment.leaveDays': { $gt: 0 } })
        .populate('student', 'name rollNumber department currentYear classDivision emergencyContact')
        .sort({ leaveFrom: -1, createdAt: -1 })
        .limit(LIST_LIMIT);

    const leaves = concerns.map((concern) => ({
        _id: concern._id,
        student: concern.student,
        leaveDays: concern.assessment.leaveDays,
        leaveFrom: concern.leaveFrom,
        leaveUntil: concern.leaveUntil,
    }));

    return res.status(200).json(
        new ApiResponse(200, { leaves, today: collegeToday() }, "Leaves")
    );
});

export { listConcerns, reportConcern, assessConcern, listLeaves }

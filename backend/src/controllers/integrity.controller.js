import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { IntegrityRecord } from '../models/integrityRecord.model.js';
import { User } from '../models/user.model.js';
import { readText } from '../utils/input.js';
import { assertReach } from '../utils/reach.js';
import { attach, attachmentNote } from '../utils/attachments.js';
import { notify } from '../utils/notices.js';
import { isValidObjectId } from '../utils/objectId.js';

const ROLL_MAX = 40;
const REASON_MAX = 500;
const LIST_LIMIT = 300;

const withRecorder = (query) => query.populate('recordedBy', 'name role');

const listRecords = asyncHandler(async (req, res) => {
    const records = await withRecorder(IntegrityRecord.find()).sort({ createdAt: -1 }).limit(LIST_LIMIT);

    return res.status(200).json(
        new ApiResponse(200, { records }, "Integrity records")
    );
});

const addRecord = asyncHandler(async (req, res) => {
    const rollNumber = readText(req.body.rollNumber, 'Roll number', { max: ROLL_MAX, required: true });
    const reason = readText(req.body.reason, 'Reason', { max: REASON_MAX, required: true });

    const student = await User.findOne({ rollNumber, role: 'student', profileStatus: 'Approved' });

    if (!student) {
        throw new ApiError(404, "No approved student has this roll number");
    }

    assertReach(req.user, student);

    // the student's details as they are today; the record belongs to the sample
    // college when the student does
    const record = await IntegrityRecord.create({
        student: student._id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        department: student.department,
        year: student.currentYear,
        reason,
        recordedBy: req.user._id,
        isDemo: student.isDemo,
    });

    // the proof is stored only once the record itself has been accepted
    const { url, problem } = await attach(req, 'integrity');
    if (url) {
        record.proofUrl = url;
        await record.save();
    }

    await notify(student._id, {
        type: 'integrity',
        title: 'An integrity record was made about you',
        body: reason,
        link: '/integrity',
    });

    return res.status(201).json(
        new ApiResponse(201, { record: await withRecorder(IntegrityRecord.findById(record._id)) }, `Record added${attachmentNote(problem)}`)
    );
});

const removeRecord = asyncHandler(async (req, res) => {
    const record = isValidObjectId(req.params.id) ? await IntegrityRecord.findById(req.params.id) : null;

    if (!record) {
        throw new ApiError(404, "Record not found");
    }

    assertReach(req.user, record);

    await record.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, {}, "Record removed")
    );
});

export { listRecords, addRecord, removeRecord }

import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User, DESIGNATIONS } from '../models/user.model.js';
import { storeFile } from '../utils/uploads.js';
import { notify } from '../utils/notices.js';
import { isValidObjectId } from '../utils/objectId.js';
import { DEMO_ID_PREFIX, isReservedId } from '../utils/demo.js';
import { readChoice, readDate, readText } from '../utils/input.js';

const DUPLICATE_KEY = 11000;

const GENDERS = ["Male", "Female", "Other"];
const ADMISSION_TYPES = ["regular", "lateral"];
const HOSTEL_STATUSES = ["Hostel", "Day Scholar"];

// label shown in messages for each field the forms may send
const STUDENT_REQUIRED = { department: 'Department', currentYear: 'Current year', classDivision: 'Division', rollNumber: 'Roll number', phoneNumber: 'Phone number' };
const STUDENT_OPTIONAL = { passingYear: 'Passing year', bloodGroup: 'Blood group', address: 'Address' };
const FACULTY_REQUIRED = { department: 'Department', designation: 'Designation', facultyId: 'Faculty ID', phoneNumber: 'Phone number' };
const FACULTY_OPTIONAL = { qualification: 'Qualification', officeRoomNumber: 'Office room', officePhoneNumber: 'Office phone', address: 'Address' };

const readFields = (body, required, optional) => {
    const fields = {};

    for (const [key, label] of Object.entries(required)) {
        fields[key] = readText(body[key], label);
        if (!fields[key]) {
            throw new ApiError(400, `${label} is required`);
        }
    }

    for (const [key, label] of Object.entries(optional)) {
        const text = readText(body[key], label);
        if (text) fields[key] = text;
    }

    return fields;
};

// multipart forms send the contact as a JSON string; JSON bodies send an object
const readEmergencyContact = (value) => {
    let contact = value;

    if (typeof value === 'string' && value.trim()) {
        try {
            contact = JSON.parse(value);
        } catch (error) {
            throw new ApiError(400, "Emergency contact is not readable");
        }
    }

    if (!contact || typeof contact !== 'object' || Array.isArray(contact)) return undefined;

    return {
        name: readText(contact.name, 'Emergency contact name'),
        relation: readText(contact.relation, 'Emergency contact relation'),
        contact: readText(contact.contact, 'Emergency contact number'),
    };
};

// what both kinds of profile have in common
const readShared = (body) => ({
    gender: readChoice(body.gender, 'Gender', GENDERS),
    dateOfBirth: readDate(body.dateOfBirth, 'Date of birth'),
    emergencyContact: readEmergencyContact(body.emergencyContact),
});

// A profile can be sent when none was sent before, or again after a rejection.
// Admin and doctor accounts have no profile to fill.
const assertCanSubmit = (user) => {
    const canFill = user.role === 'student' || user.role === 'faculty';

    if (!canFill || !['NotFilled', 'Rejected'].includes(user.profileStatus)) {
        throw new ApiError(409, "Your profile has already been submitted");
    }
};

// Saves the profile as waiting for approval. Role, status and duties are decided
// here and by an admin; whatever the form sends for them is not read.
const submitProfile = async (req, role, fields, duplicateMessage) => {
    const user = await User.findById(req.user._id);
    assertCanSubmit(user);

    Object.assign(user, fields, { role, profileStatus: 'Pending' });
    user.rejectionReason = undefined;

    // someone who was rejected as one role and now applies as the other gives up the old number
    if (role === 'student') user.facultyId = undefined;
    if (role === 'faculty') user.rollNumber = undefined;

    try {
        await user.save();
    } catch (error) {
        // the roll number and the faculty ID are unique; the index decides when two arrive together
        if (error.code === DUPLICATE_KEY) {
            throw new ApiError(409, duplicateMessage);
        }
        throw error;
    }

    // The file is stored only once the profile itself has been accepted, so a refused
    // form leaves nothing behind. A file that cannot be stored does not undo the profile.
    let fileStored = true;
    if (req.file) {
        const idProof = await storeFile(req.file, 'profiles').catch(() => null);

        if (idProof) {
            user.idProof = idProof;
            await user.save();
        } else {
            fileStored = false;
        }
    }

    return { user, fileStored };
};

const submittedMessage = (fileStored) => (fileStored
    ? "Profile submitted. An admin will review it."
    : "Profile submitted, but the file could not be stored. An admin will review it.");

// numbers of the sample college are not for real accounts
const assertNotReserved = (req, value, label) => {
    if (!req.user.isDemo && isReservedId(value)) {
        throw new ApiError(400, `${label} starting with ${DEMO_ID_PREFIX} are reserved`);
    }
};

const submitStudentProfile = asyncHandler(async (req, res) => {
    const fields = {
        ...readFields(req.body, STUDENT_REQUIRED, STUDENT_OPTIONAL),
        ...readShared(req.body),
        admissionType: readChoice(req.body.admissionType, 'Admission type', ADMISSION_TYPES),
        admissionDate: readDate(req.body.admissionDate, 'Admission date'),
        hostelStatus: readChoice(req.body.hostelStatus, 'Hostel status', HOSTEL_STATUSES),
    };

    assertNotReserved(req, fields.rollNumber, 'Roll numbers');

    const { user, fileStored } = await submitProfile(req, 'student', fields, "This roll number is already registered");

    return res.status(200).json(
        new ApiResponse(200, { user }, submittedMessage(fileStored))
    );
});

const submitFacultyProfile = asyncHandler(async (req, res) => {
    const fields = {
        ...readFields(req.body, FACULTY_REQUIRED, FACULTY_OPTIONAL),
        ...readShared(req.body),
        joiningDate: readDate(req.body.joiningDate, 'Joining date'),
    };

    if (!DESIGNATIONS.includes(fields.designation)) {
        throw new ApiError(400, `Designation must be one of: ${DESIGNATIONS.join(', ')}`);
    }

    assertNotReserved(req, fields.facultyId, 'Faculty IDs');

    const { user, fileStored } = await submitProfile(req, 'faculty', fields, "This faculty ID is already registered");

    return res.status(200).json(
        new ApiResponse(200, { user }, submittedMessage(fileStored))
    );
});

// The demo admin is a public account: anyone can log in as it. It manages the sample
// college only and never sees or decides a real person's account.
const withinReach = (admin) => (admin.isDemo ? { isDemo: true } : {});

const getPendingProfiles = asyncHandler(async (req, res) => {
    const pending = await User.find({ ...withinReach(req.user), profileStatus: 'Pending', role: { $in: ['student', 'faculty'] } }).sort({ updatedAt: 1 });

    return res.status(200).json(
        new ApiResponse(200, {
            students: pending.filter((user) => user.role === 'student'),
            faculty: pending.filter((user) => user.role === 'faculty'),
        }, "Profiles waiting for a decision")
    );
});

// approved faculty, for giving duties
const getApprovedFaculty = asyncHandler(async (req, res) => {
    const faculty = await User.find({ ...withinReach(req.user), role: 'faculty', profileStatus: 'Approved' }).sort({ name: 1 });

    return res.status(200).json(
        new ApiResponse(200, { faculty }, "Approved faculty")
    );
});

// an account the admin may act on; one outside their reach looks like one that does not exist
const findUser = async (userId, admin) => {
    const user = isValidObjectId(userId) ? await User.findOne({ ...withinReach(admin), _id: userId }) : null;

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return user;
};

// Moves a pending profile to its decision. The filter makes sure two admins deciding
// at the same moment cannot both succeed.
const decide = async (userId, admin, changes) => {
    const user = await findUser(userId, admin);

    const decided = await User.findOneAndUpdate(
        { _id: user._id, profileStatus: 'Pending' },
        changes,
        { new: true }
    );

    if (!decided) {
        throw new ApiError(409, "This profile is not waiting for a decision");
    }

    return decided;
};

const approveProfile = asyncHandler(async (req, res) => {
    const user = await decide(req.params.userId, req.user, { $set: { profileStatus: 'Approved' }, $unset: { rejectionReason: 1 } });

    await notify(user._id, { type: 'profile', title: 'Your profile was approved', body: 'You can now use the system.', link: '/' });

    return res.status(200).json(
        new ApiResponse(200, { user }, "Profile approved")
    );
});

const rejectProfile = asyncHandler(async (req, res) => {
    const reason = readText(req.body.reason, 'Reason');

    if (!reason) {
        throw new ApiError(400, "A reason is required");
    }

    const user = await decide(req.params.userId, req.user, { $set: { profileStatus: 'Rejected', rejectionReason: reason } });

    await notify(user._id, { type: 'profile', title: 'Your profile was rejected', body: reason, link: '/profile-rejected' });

    return res.status(200).json(
        new ApiResponse(200, { user }, "Profile rejected")
    );
});

// Board membership and class coordination are given by an admin, never claimed
const setDuties = asyncHandler(async (req, res) => {
    const user = await findUser(req.params.userId, req.user);

    if (user.role !== 'faculty') {
        throw new ApiError(400, "Duties can only be given to faculty");
    }

    const { isBoardMember, coordinatorOf } = req.body;

    if (isBoardMember !== undefined) {
        if (typeof isBoardMember !== 'boolean') {
            throw new ApiError(400, "Board member must be true or false");
        }
        user.isBoardMember = isBoardMember;
    }

    if (coordinatorOf === null) {
        user.coordinatorOf = undefined;
    } else if (coordinatorOf !== undefined) {
        if (typeof coordinatorOf !== 'object' || Array.isArray(coordinatorOf)) {
            throw new ApiError(400, "Coordinator class is not readable");
        }

        const assigned = {
            department: readText(coordinatorOf.department, 'Department'),
            year: readText(coordinatorOf.year, 'Year'),
            division: readText(coordinatorOf.division, 'Division'),
        };

        if (!assigned.department || !assigned.year || !assigned.division) {
            throw new ApiError(400, "Department, year and division are required for a coordinator");
        }

        user.coordinatorOf = assigned;
    }

    await user.save();

    return res.status(200).json(
        new ApiResponse(200, { user }, "Duties updated")
    );
});

export {
    submitStudentProfile,
    submitFacultyProfile,
    getPendingProfiles,
    getApprovedFaculty,
    approveProfile,
    rejectProfile,
    setDuties
}

// The sample college: accounts visitors can log in with, and enough other people
// around them for every part of the system to have something to show.
// Everything here lives under DEMO_DOMAIN, and only that is ever removed.
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Notice } from '../models/notice.model.js';
import { buildSampleContent, removeSampleContent } from './sampleContent.js';

import { DEMO_DOMAIN, DEMO_ID_PREFIX } from '../utils/demo.js';

export { DEMO_DOMAIN };
export const DEMO_PASSWORD = 'Demo@123';

// the four accounts behind the buttons on the login page
export const DEMO_LOGINS = {
    student: `student${DEMO_DOMAIN}`,
    faculty: `faculty${DEMO_DOMAIN}`,
    admin: `admin${DEMO_DOMAIN}`,
    doctor: `doctor${DEMO_DOMAIN}`,
};

const contact = (name, relation) => ({ name, relation, contact: '9000000000' });

const student = (name, email, rollNumber, department, currentYear, classDivision, extra = {}) => ({
    name, email, department, currentYear, classDivision,
    rollNumber: `${DEMO_ID_PREFIX}${rollNumber}`,
    role: 'student', phoneNumber: '9800000000', gender: 'Other', hostelStatus: 'Day Scholar',
    admissionType: 'regular', emergencyContact: contact(`${name.split(' ')[0]}'s parent`, 'Parent'),
    ...extra,
});

const faculty = (name, email, facultyId, department, designation, extra = {}) => ({
    name, email, department, designation,
    facultyId: `${DEMO_ID_PREFIX}${facultyId}`,
    role: 'faculty', phoneNumber: '9811111111', qualification: 'M.Tech',
    ...extra,
});

const people = [
    // the demo logins
    student('Riya Demo', DEMO_LOGINS.student, 'CS-TE-A-01', 'Computer', 'TE', 'A'),
    faculty('Prof. Anil Demo', DEMO_LOGINS.faculty, 'FAC-100', 'Computer', 'Professor', {
        isBoardMember: true,
        // coordinator of the demo student's class
        coordinatorOf: { department: 'Computer', year: 'TE', division: 'A' },
    }),
    { name: 'Admin Demo', email: DEMO_LOGINS.admin, role: 'admin' },
    { name: 'Dr. Kavita Demo', email: DEMO_LOGINS.doctor, role: 'doctor' },

    // the rest of the college
    student('Aarav Mehta', `aarav${DEMO_DOMAIN}`, 'CS-TE-A-02', 'Computer', 'TE', 'A', { hostelStatus: 'Hostel' }),
    student('Diya Sharma', `diya${DEMO_DOMAIN}`, 'CS-TE-A-03', 'Computer', 'TE', 'A'),
    student('Kabir Khan', `kabir${DEMO_DOMAIN}`, 'CS-TE-B-01', 'Computer', 'TE', 'B'),
    student('Ananya Rao', `ananya${DEMO_DOMAIN}`, 'IT-SE-A-01', 'IT', 'SE', 'A', { hostelStatus: 'Hostel' }),
    student('Vihaan Joshi', `vihaan${DEMO_DOMAIN}`, 'IT-SE-A-02', 'IT', 'SE', 'A'),
    student('Meera Nair', `meera${DEMO_DOMAIN}`, 'IT-BE-A-01', 'IT', 'BE', 'A'),
    faculty('Prof. Sunita Patil', `sunita${DEMO_DOMAIN}`, 'FAC-101', 'Computer', 'Associate Professor', { isBoardMember: true }),
    faculty('Prof. Rajesh Kulkarni', `rajesh${DEMO_DOMAIN}`, 'FAC-102', 'IT', 'Assistant Professor', { isBoardMember: true }),
    faculty('Prof. Neha Deshpande', `neha${DEMO_DOMAIN}`, 'FAC-103', 'IT', 'Lecturer'),

    // two profiles for the admin to decide
    student('Ishaan Verma', `ishaan${DEMO_DOMAIN}`, 'CS-SE-A-01', 'Computer', 'SE', 'A', { profileStatus: 'Pending' }),
    faculty('Prof. Pooja Iyer', `pooja${DEMO_DOMAIN}`, 'FAC-104', 'Computer', 'Lecturer', { profileStatus: 'Pending' }),
];

const demoUserIds = async () => {
    const pattern = new RegExp(`${DEMO_DOMAIN.replace('.', '\\.')}$`);
    const users = await User.find({ email: pattern }).select('_id');
    return users.map((user) => user._id);
};

// The same account gets the same id at every rebuild, so a visitor who is logged in
// as a demo account stays logged in when the server restarts.
const stableId = (email) =>
    new mongoose.Types.ObjectId(crypto.createHash('md5').update(email).digest('hex').slice(0, 24));

// Removes everything that belongs to the sample college. Accounts made by real
// sign-ups are not touched.
const removeSampleCollege = async () => {
    await removeSampleContent();

    const ids = await demoUserIds();

    await Notice.deleteMany({ user: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
};

// Builds the sample college from scratch. Safe to run at every start of the server.
const rebuildSampleCollege = async () => {
    await removeSampleCollege();

    // User.create runs the password hashing hook; insertMany would not
    const users = await Promise.all(people.map((person) => User.create({
        _id: stableId(person.email),
        password: DEMO_PASSWORD,
        isVerified: true,
        isDemo: true,
        profileStatus: 'Approved',
        ...person,
    })));

    // the content refers to people by the first part of their address: who.student, who.aarav
    const who = Object.fromEntries(users.map((user) => [user.email.split('@')[0], user]));
    await buildSampleContent(who);

    return { users: users.length };
};

// Admins and the doctor do not sign up: their accounts come from the settings, made once
const ensureStaff = async (role, name, emailKey, passwordKey) => {
    const email = (process.env[emailKey] || '').trim().toLowerCase();
    const password = process.env[passwordKey];

    if (!email || !password) return false;
    if (await User.exists({ email })) return false;

    await User.create({ name, email, password, role, isVerified: true, profileStatus: 'Approved' });
    return true;
};

// A real admin account for the owner of the installation
const ensureAdmin = () => ensureStaff('admin', 'Administrator', 'ADMIN_EMAIL', 'ADMIN_PASSWORD');

// The college's own doctor, who answers the health concerns of real students
const ensureDoctor = () => ensureStaff('doctor', 'College Doctor', 'DOCTOR_EMAIL', 'DOCTOR_PASSWORD');

// For the start of the server: a sample college that cannot be built must not keep the
// server from starting, so the failure is reported and the server carries on.
const startSampleCollege = async () => {
    try {
        const { users } = await rebuildSampleCollege();
        console.log(`Sample college rebuilt: ${users} accounts`);
        return true;
    } catch (error) {
        console.log(`Sample college could not be rebuilt: ${error.message}`);
        return false;
    }
};

export { rebuildSampleCollege, removeSampleCollege, startSampleCollege, ensureAdmin, ensureDoctor }

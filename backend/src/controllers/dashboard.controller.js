import asyncHandler from '../utils/asynchandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { Notice } from '../models/notice.model.js';

// A card is one figure on the dashboard: { key, label, value, link }.
// Each module adds its own cards here as it is built.
const adminCards = async () => {
    const [pendingProfiles, students, faculty] = await Promise.all([
        User.countDocuments({ profileStatus: 'Pending', role: { $in: ['student', 'faculty'] } }),
        User.countDocuments({ role: 'student', profileStatus: 'Approved' }),
        User.countDocuments({ role: 'faculty', profileStatus: 'Approved' }),
    ]);

    return [
        { key: 'pendingProfiles', label: 'Profiles waiting for approval', value: pendingProfiles, link: '/pending-request' },
        { key: 'students', label: 'Approved students', value: students, link: '/pending-request' },
        { key: 'faculty', label: 'Approved faculty', value: faculty, link: '/pending-request' },
    ];
};

const getDashboard = asyncHandler(async (req, res) => {
    const unreadNotices = await Notice.countDocuments({ user: req.user._id, readAt: null });

    const cards = [{ key: 'unreadNotices', label: 'Unread notices', value: unreadNotices, link: '/' }];

    if (req.user.role === 'admin') {
        cards.unshift(...await adminCards());
    }

    return res.status(200).json(
        new ApiResponse(200, { role: req.user.role, unreadNotices, cards }, "Dashboard")
    );
});

export { getDashboard }

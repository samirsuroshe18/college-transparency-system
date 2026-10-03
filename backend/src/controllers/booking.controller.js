import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Booking, SlotLock } from '../models/booking.model.js';
import { findFacility } from './facility.controller.js';
import { readChoice, readText } from '../utils/input.js';
import { assertReach } from '../utils/reach.js';
import { notify } from '../utils/notices.js';
import { isValidObjectId } from '../utils/objectId.js';

const DUPLICATE_KEY = 11000;
const PURPOSE_MAX = 500;
const REASON_MAX = 500;
const LIST_LIMIT = 300;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const OVERLAP = "This time overlaps an approved booking";
const ALREADY_DECIDED = "This request has already been decided";

const today = () => new Date().toISOString().slice(0, 10);

// a real calendar day written as YYYY-MM-DD; 2026-02-30 is not one
const readDay = (value) => {
    const text = readText(value, 'Date', { required: true });
    const day = DATE_PATTERN.test(text) ? new Date(`${text}T00:00:00Z`) : null;

    if (!day || Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== text) {
        throw new ApiError(400, "The date must be YYYY-MM-DD");
    }

    return text;
};

const readTime = (value, label) => {
    const text = readText(value, label, { required: true });

    if (!TIME_PATTERN.test(text)) {
        throw new ApiError(400, "Times must be HH:MM");
    }

    return text;
};

// An approved booking of the same facility and day whose time crosses this one.
// A booking that ends when the other starts does not cross it.
const findOverlap = (booking, excludeId) => Booking.findOne({
    facility: booking.facility,
    date: booking.date,
    status: 'approved',
    startTime: { $lt: booking.endTime },
    endTime: { $gt: booking.startTime },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Runs one piece of work at a time for a facility and day. Checking for an overlap
// and approving are two steps; without this, two approvals could both pass the check.
const withSlotLock = async (facilityId, date, work) => {
    const lockId = `${facilityId}:${date}`;
    const STALE_MS = 10000;

    for (let attempt = 0; attempt < 60; attempt += 1) {
        try {
            await SlotLock.create({ _id: lockId });

            try {
                return await work();
            } finally {
                await SlotLock.deleteOne({ _id: lockId });
            }
        } catch (error) {
            if (error.code !== DUPLICATE_KEY) throw error;

            // someone else holds it; a lock nobody released is taken over after a while
            await SlotLock.deleteOne({ _id: lockId, createdAt: { $lt: new Date(Date.now() - STALE_MS) } });
            await wait(50);
        }
    }

    throw new ApiError(409, "Another decision for this facility is in progress. Please try again.");
};

const present = (booking, viewer) => ({
    ...booking.toObject(),
    mine: String(booking.user?._id || booking.user) === String(viewer._id),
});

const withPeople = (query) => query
    .populate('facility', 'name location')
    .populate('user', 'name role department')
    .populate('decidedBy', 'name');

const findBooking = async (id) => {
    const booking = isValidObjectId(id) ? await Booking.findById(id) : null;

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    return booking;
};

const listBookings = asyncHandler(async (req, res) => {
    const filter = {};

    if (req.query.mine === 'true') filter.user = req.user._id;

    if (req.query.facility !== undefined) {
        // a facility id that is not an id matches nothing
        if (!isValidObjectId(req.query.facility)) {
            return res.status(200).json(new ApiResponse(200, { bookings: [] }, "Bookings"));
        }
        filter.facility = req.query.facility;
    }

    const bookings = await withPeople(Booking.find(filter)).sort({ date: -1, startTime: 1 }).limit(LIST_LIMIT);

    return res.status(200).json(
        new ApiResponse(200, { bookings: bookings.map((booking) => present(booking, req.user)) }, "Bookings")
    );
});

const requestBooking = asyncHandler(async (req, res) => {
    const facility = await findFacility(req.body.facility);
    assertReach(req.user, facility);

    const date = readDay(req.body.date);
    const startTime = readTime(req.body.startTime, 'Start time');
    const endTime = readTime(req.body.endTime, 'End time');
    const purpose = readText(req.body.purpose, 'Purpose', { max: PURPOSE_MAX, required: true });

    if (endTime <= startTime) {
        throw new ApiError(400, "The end time must be after the start time");
    }

    if (date < today()) {
        throw new ApiError(400, "The date cannot be in the past");
    }

    if (!facility.available) {
        throw new ApiError(409, "This facility is not available");
    }

    const wanted = { facility: facility._id, date, startTime, endTime };

    if (await findOverlap(wanted)) {
        throw new ApiError(409, OVERLAP);
    }

    const booking = await Booking.create({
        ...wanted,
        purpose,
        user: req.user._id,
        // a booking of a sample facility goes when the sample college is rebuilt
        isDemo: req.user.isDemo || facility.isDemo,
    });

    return res.status(201).json(
        new ApiResponse(201, { booking }, "Request sent. An admin will decide.")
    );
});

const describeSlot = (booking, facilityName) => `${facilityName}, ${booking.date} ${booking.startTime} to ${booking.endTime}`;

const decideBooking = asyncHandler(async (req, res) => {
    const booking = await findBooking(req.params.id);
    assertReach(req.user, booking);

    const status = readChoice(req.body.status, 'Status', ['approved', 'rejected'], { required: true });
    const reason = readText(req.body.reason, 'Reason', { max: REASON_MAX });

    if (status === 'rejected' && !reason) {
        throw new ApiError(400, "A reason is required");
    }

    const decision = { status, decidedBy: req.user._id, decidedAt: new Date(), ...(status === 'rejected' ? { reason } : {}) };

    // only a request that is still pending can be decided
    const decide = async () => {
        const updated = await Booking.findOneAndUpdate({ _id: booking._id, status: 'pending' }, { $set: decision }, { new: true });

        if (!updated) {
            throw new ApiError(409, ALREADY_DECIDED);
        }

        return updated;
    };

    const decided = status === 'approved'
        ? await withSlotLock(booking.facility, booking.date, async () => {
            if (await findOverlap(booking, booking._id)) {
                throw new ApiError(409, OVERLAP);
            }
            return decide();
        })
        : await decide();

    const facility = await findFacility(String(booking.facility)).catch(() => ({ name: 'Facility' }));
    const slot = describeSlot(decided, facility.name);

    await notify(decided.user, {
        type: 'booking',
        title: `Your booking was ${status}`,
        body: status === 'rejected' ? `${slot}. Reason: ${reason}` : slot,
        link: '/facility',
    });

    return res.status(200).json(
        new ApiResponse(200, { booking: decided }, `Booking ${status}`)
    );
});

const cancelBooking = asyncHandler(async (req, res) => {
    const booking = await findBooking(req.params.id);

    // someone else's request looks like one that does not exist
    if (String(booking.user) !== String(req.user._id)) {
        throw new ApiError(404, "Booking not found");
    }

    const cancelled = await Booking.findOneAndUpdate({ _id: booking._id, status: 'pending' }, { $set: { status: 'cancelled' } }, { new: true });

    if (!cancelled) {
        throw new ApiError(409, ALREADY_DECIDED);
    }

    return res.status(200).json(
        new ApiResponse(200, { booking: cancelled }, "Request cancelled")
    );
});

export { listBookings, requestBooking, decideBooking, cancelBooking }

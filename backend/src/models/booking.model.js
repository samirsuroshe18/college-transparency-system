import mongoose, { Schema } from "mongoose";

export const BOOKING_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

const bookingSchema = new Schema({
    facility: {
        type: Schema.Types.ObjectId,
        ref: 'Facility',
        required: true,
    },

    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // the day as YYYY-MM-DD and the times as HH:MM, exactly as they are booked;
    // text of this shape sorts and compares in time order
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },

    purpose: {
        type: String,
        required: true,
        trim: true,
    },

    status: {
        type: String,
        enum: BOOKING_STATUSES,
        default: 'pending',
    },

    // why a request was rejected
    reason: { type: String, trim: true },

    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decidedAt: Date,

    // part of the sample college
    isDemo: {
        type: Boolean,
        default: false,
    },

}, { timestamps: true });

// overlap checks and the list both look up one facility's bookings by day
bookingSchema.index({ facility: 1, date: 1 });

export const Booking = mongoose.model("Booking", bookingSchema);

// Held while a request for one facility and day is being approved, so that two
// approvals for the same time cannot both get through. The id is "<facility>:<date>".
const slotLockSchema = new Schema({
    _id: String,
    // a lock left behind by a stopped server is removed by the database after a while
    createdAt: { type: Date, default: Date.now, expires: 60 },
});

export const SlotLock = mongoose.model("SlotLock", slotLockSchema);

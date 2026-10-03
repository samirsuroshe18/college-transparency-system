import mongoose, { Schema } from "mongoose";

// A hall, a lab, a ground: something of the college that can be booked
const facilitySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },

    description: {
        type: String,
        required: true,
        trim: true,
    },

    location: {
        type: String,
        required: true,
        trim: true,
    },

    // an unavailable facility is listed but cannot be requested
    available: {
        type: Boolean,
        default: true,
    },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },

    // part of the sample college
    isDemo: {
        type: Boolean,
        default: false,
    },

}, { timestamps: true });

export const Facility = mongoose.model("Facility", facilitySchema);

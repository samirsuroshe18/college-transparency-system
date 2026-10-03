import mongoose, { Schema } from "mongoose";

// Something a user should know about: a decision on their profile, request or
// application, a record made about them, a leave they were given.
const noticeSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // what the notice is about, for example "profile" or "booking"
    type: {
        type: String,
        required: true,
        trim: true,
    },

    title: {
        type: String,
        required: true,
        trim: true,
    },

    body: {
        type: String,
        trim: true,
    },

    // page of the web app that shows the details
    link: {
        type: String,
        trim: true,
    },

    readAt: Date,

}, { timestamps: true });

// a user's notices are always read newest first
noticeSchema.index({ user: 1, createdAt: -1 });

export const Notice = mongoose.model("Notice", noticeSchema);

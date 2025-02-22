import mongoose from "mongoose";

const cheatingSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to user.model.js
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    proof: {
        type: String, // URL for proof (image/video/document)
        required: true,
    },
    reportedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

const Cheating = mongoose.model("Cheating", cheatingSchema);

export default Cheating;
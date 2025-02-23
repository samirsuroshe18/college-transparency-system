import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },

    // 🗳 Like/Dislike System
    likes: {type: Number, default:0},  // Users who liked
    dislikes: {type: Number, default: 0}, // Users who disliked


    isRevealed: { type: Boolean, default: false },

    // 📁 Supported Documents (Images & Videos)
    documentUrl: { type: String, required: false },
    // 📅 Date Tracking
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Automatically update `updatedAt` before saving
complaintSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

const Complaint = mongoose.model("Complaint", complaintSchema);
export default Complaint;


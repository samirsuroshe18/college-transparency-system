import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
    budget: { type: String, required: true },
    requestedAmount: { type: Number, required: true },
    approvedAmount: { type: Number, default: 0 },
    document: { type: String }, // File URL
    category: { type: String, enum: ["event", "department", "mess", "other"], required: true },
    isVerified: { type: Boolean, default: false },
    description: { type: String, trim: true, required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
}, { timestamps: true });

const Budget = mongoose.model("Budget", budgetSchema);

export default Budget;

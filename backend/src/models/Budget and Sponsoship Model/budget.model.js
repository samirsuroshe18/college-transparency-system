import mongoose from "mongoose";


const budgetSchema = new mongoose.Schema({
    eventName: { type: String, required: true },
    department: { type: String, required: true },
    requestedAmount: { type: Number, required: true },
    approvedAmount: { type: Number },
    sponsors: [String],
    expenseProofs: [String]
});
const Budget = mongoose.model("Budget", budgetSchema);

export default Budget;
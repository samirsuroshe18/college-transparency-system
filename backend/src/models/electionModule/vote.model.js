import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true },
  voterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
});

// ✅ Compound Index: One vote per user per election
voteSchema.index({ electionId: 1, voterId: 1 }, { unique: true });

const Vote = mongoose.model("Vote", voteSchema);
export default Vote;

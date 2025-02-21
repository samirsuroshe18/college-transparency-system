import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true },
  voterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true }, // One vote per user
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
});

const Vote = mongoose.model("Vote", voteSchema);
export default Vote;

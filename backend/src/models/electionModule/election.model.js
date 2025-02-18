import mongoose from "mongoose";

const ElectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  electionDate: { type: Date, required: true },
  applicationDeadline: { type: Date, required: true },
  ended: { type: Boolean, default: false },
  winner: { type: String, default: null },
});

const Election = mongoose.model("Election", ElectionSchema);
export default Election;

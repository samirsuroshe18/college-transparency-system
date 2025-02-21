import Vote from "../../models/electionModule/vote.model.js";
import Election from "../../models/electionModule/election.model.js";

// 📌 Function to cast a vote
export const castVote = async (req, res) => {
  const { electionId, voterId, candidateId } = req.body;

  if (!electionId || !voterId || !candidateId) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    // ✅ Check if election is live
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: "Election not found." });

    const today = new Date();
    const deadline = new Date(election.applicationDeadline);
    if (deadline >= today) return res.status(400).json({ message: "Election is not live yet." });

    // ✅ Check if user has already voted
    const existingVote = await Vote.findOne({ electionId, voterId });
    if (existingVote) return res.status(403).json({ message: "You have already voted in this election." });

    // ✅ Save the vote
    const newVote = new Vote({ electionId, voterId, candidateId });
    await newVote.save();

    res.status(201).json({ message: "Vote recorded successfully!" });
  } catch (error) {
    console.error("Error voting:", error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

// 📌 Function to check if user has voted
export const hasVoted = async (req, res) => {
  const { electionId, voterId } = req.params;

  try {
    const existingVote = await Vote.findOne({ electionId, voterId });
    res.json({ hasVoted: !!existingVote });
  } catch (error) {
    console.error("Error checking vote status:", error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

import Vote from "../../models/electionModule/vote.model.js";
import Election from "../../models/electionModule/election.model.js";
import { User } from "../../models/user.model.js";

// 📌 Function to cast a vote
export const castVote = async (req, res) => {
  const { electionId, candidateId } = req.body;
  const voterId = req.user._id; // Extract voter ID from authentication middleware

  if (!electionId || !candidateId) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    // ✅ Check if election exists and is live
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: "Election not found." });

    const now = new Date();
    if (now < new Date(election.applicationDeadline)) {
      return res.status(400).json({ message: "Election is not live yet." });
    }
    if (now > new Date(election.electionDate) || election.ended) {
      return res.status(400).json({ message: "Election has ended." });
    }

    // ✅ Check if user meets voting criteria
    const voter = await User.findById(voterId);
    if (!voter) return res.status(404).json({ message: "Voter not found." });

    if (election.votingCriteria.branch && voter.department !== election.votingCriteria.branch) {
      return res.status(403).json({ message: "You are not eligible to vote in this election." });
    }
    if (election.votingCriteria.year && voter.currentYear !== election.votingCriteria.year) {
      return res.status(403).json({ message: "You are not eligible to vote in this election." });
    }
    if (election.votingCriteria.division && voter.classDivision !== election.votingCriteria.division) {
      return res.status(403).json({ message: "You are not eligible to vote in this election." });
    }

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
  const { electionId } = req.params;
  const voterId = req.user._id; // Extract voter ID from authentication middleware

  try {
    const existingVote = await Vote.findOne({ electionId, voterId });
    res.json({ hasVoted: !!existingVote });
  } catch (error) {
    console.error("Error checking vote status:", error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

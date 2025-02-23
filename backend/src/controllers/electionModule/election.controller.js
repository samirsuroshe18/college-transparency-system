import mongoose from "mongoose";
import Election from "../../models/electionModule/election.model.js";
import moment from "moment"; // Install using: npm install moment

export const createElectionAdmin = async (req, res) => {
  try {
    const {
      title,
      electionDate,
      applicationDeadline,
      votingCriteria
    } = req.body;

    // Validate required fields
    if (!title || !electionDate || !applicationDeadline) {
      return res.status(400).json({
        error: "Title, Election Date, and Application Deadline are required."
      });
    }

    // Validate dates
    if (new Date(applicationDeadline) >= new Date(electionDate)) {
      return res.status(400).json({
        error: "Application deadline must be before the election date."
      });
    }

    // Create new election
    const newElection = await Election.create({
      title,
      electionDate,
      applicationDeadline,
      votingCriteria,
      ended: false, // Default value
      winner: null  // Default value
    });

    res.status(201).json({
      message: "Election created successfully",
      data: newElection
    });
  } catch (error) {
    console.error("Error creating election:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getElections = async (req, res) => {
  try {
    const elections = await Election.find();
    return res.json(elections);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const getLiveElections = async (req, res) => {
  try {
    const today = new Date();

    // Fetch elections where electionDate is today or in the future
    const liveElections = await Election.find({
      electionDate: { $gte: today }
    });

    const formattedElections = liveElections.map((election) => ({
      _id: election._id,
      title: election.title,
      electionDate: moment(election.electionDate).format("MMMM Do YYYY"),
      applicationDeadline: moment(election.applicationDeadline).format("MMMM Do YYYY"),
      votingCriteria: election.votingCriteria
    }));

    return res.status(200).json(formattedElections);
  } catch (error) {
    res.status(500).json({ message: "Error fetching live elections" });
  }
};

// Route: router.put("/end/:id", endElection);

export const endElection = async (req, res) => {
  try {
    const { id } = req.params;
    const electionId = mongoose.Types.ObjectId.createFromHexString(req.params.id);

    // Update election to ended: true
    const election = await Election.findByIdAndUpdate(
      electionId,
      { ended: true },
      { new: true }
    );

    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    res.json({
      message: "Election ended successfully",
      data: election
    });
  } catch (error) {
    console.error("Error ending election:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const upcomingElection = async (req, res) => {
  try {
    const elections = await Election.find(); // ✅ Ensure this works
    res.json(elections);
  } catch (error) {
    console.error("Error fetching elections:", error); // ✅ Log error
    res.status(500).json({ message: "Server Error" });
  }
}

export const getCompletedElections = async (req, res) => {
  try {
    const today = new Date();

    // Fetch elections where electionDate has passed and ended is true
    const completedElections = await Election.find({
      electionDate: { $lt: today },
      ended: true
    });

    // Format the response
    const formattedElections = completedElections.map((election) => ({
      _id: election._id,
      title: election.title,
      electionDate: moment(election.electionDate).format("MMMM Do YYYY"),
      applicationDeadline: moment(election.applicationDeadline).format("MMMM Do YYYY"),
      votingCriteria: election.votingCriteria,
      ended: election.ended,
      winner: election.winner || "TBD" // If winner isn't set yet
    }));

    res.status(200).json(formattedElections);
  } catch (error) {
    console.error("Error fetching completed elections:", error);
    res.status(500).json({ message: "Error fetching completed elections", error: error.message });
  }
};

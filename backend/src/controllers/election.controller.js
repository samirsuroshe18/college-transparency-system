import Election from "../models/election.model.js";

// Create Election
export const createElection = async (req, res) => {
  try {
    const { title, electionDate, applicationDeadline } = req.body;
    const newElection = new Election({ title, electionDate, applicationDeadline });
    await newElection.save();
    res.status(201).json(newElection);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get All Elections
export const getElections = async (req, res) => {
  try {
    const elections = await Election.find();
    res.json(elections);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// End Election
export const endElection = async (req, res) => {
  try {
    const { id } = req.params;
    const election = await Election.findByIdAndUpdate(id, { ended: true }, { new: true });
    res.json(election);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

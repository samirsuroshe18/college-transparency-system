import Election from "../../models/electionModule/election.model.js";

import moment from "moment"; // Install using: npm install moment

export const createElection = async (req, res) => {
  try {
    const { title, electionDate, applicationDeadline, votingCriteria = {} } = req.body;

    // Ensure votingCriteria has default values
    const formattedVotingCriteria = {
      branch: votingCriteria.branch || "",
      year: votingCriteria.year || "",
      division: votingCriteria.division || ""
    };

    const newElection = new Election({
      title,
      electionDate,
      applicationDeadline,
      votingCriteria: formattedVotingCriteria
    });

    await newElection.save();

    // Format the dates before sending the response
    res.status(201).json({
      _id: newElection._id,
      title: newElection.title,
      electionDate: moment(newElection.electionDate).format("MMMM Do YYYY"), // Example: March 1st 2025
      applicationDeadline: moment(newElection.applicationDeadline).format("MMMM Do YYYY"),
      votingCriteria: newElection.votingCriteria
    });
  } catch (error) {
    console.error("Error creating election:", error);
    res.status(500).json({ message: error.message });
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

    res.status(200).json(formattedElections);
  } catch (error) {
    res.status(500).json({ message: "Error fetching live elections" });
  }
};


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

import mongoose from "mongoose";
import Complaint from "../../models/ComplaintModule/complaint.model.js";
import ApiError from "../../utils/ApiError.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";

// Submit a new complaint
const submitComplaint = async (req, res) => {
  try {
    const { title, description, isAnonymous } = req.body;
    // Validate required fields
    if (!title || !description || !isAnonymous) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "File not found" });
    }

    const file = await uploadOnCloudinary(req?.file?.path);

    if (!file) {
      return res
        .status(400)
        .json({ error: "Error while uploading on cloudinary" });
    }

    console.log("file url:", file.url);

    // Single destructuring with default values

    const complaint = new Complaint({
      userId: req.user._id,
      title,
      description,
      isAnonymous,
      documentUrl: file?.url,
      date: new Date(),
    });

    await complaint.save();
    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error: " + error.message,
    });
  }
};

// Get all complaints
const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ date: -1 });
    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ error: "Server Error: " + error.message });
  }
};

// Upvote or Downvote a complaint

const voteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid complaint ID" });
    }

    console.log("Fetching complaint...");
    const complaint = await Complaint.findById(id);
    if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
    }

    console.log("Complaint found:", complaint);

    // Update likes/dislikes
    if (voteType === "likes") {
        complaint.likes = (complaint.likes || 0) + 1;
    } else if (voteType === "dislikes") {
        complaint.dislikes = (complaint.dislikes || 0) + 1;
    } else {
        return res.status(400).json({ error: "Invalid vote type" });
    }

    console.log("Before Save");
    await complaint.save({ validateBeforeSave: true });
    console.log("After Save");

    console.log("Vote updated successfully:", complaint);

    return res.status(200).json({
        success: true,
        message: "Vote updated",
        complaint,
    });

} catch (error) {
        console.error("Error updating vote:", error);
        return res.status(500).json({ error: error.message });
    }
};

export { submitComplaint, getComplaints, voteComplaint };

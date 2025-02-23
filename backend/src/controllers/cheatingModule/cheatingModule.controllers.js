import mongoose from "mongoose"; // Import mongoose for ObjectId validation
import CheatingReport from "../../models/Cheating/cheating.model.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";

export const addCheatingIncident = async (req, res) => {
    try {
        const { name, rollNo, department, studentClass, reason } = req.body;
        const proof = req.file; // Assuming proof is uploaded as a file

        console.log("Received Data:");
        console.log("Name:", name);
        console.log("Roll No:", rollNo);
        console.log("Department:", department);
        console.log("Class:", studentClass);
        console.log("Reason:", reason);
        console.log("Proof:", proof);

        // Validate required fields
        if (!name || !rollNo || !department || !studentClass || !reason || !proof) {
            return res.status(400).json({ message: "All fields are required (name, rollNo, department, studentClass, reason, proof)" });
        }

        // Upload proof to Cloudinary and get the URL
        const file = await uploadOnCloudinary(proof.path);
        if (file.error) {
            return res.status(400).json({ message: "Error uploading proof to Cloudinary" });
        }

        // Create a new cheating report
        const cheatingReport = await CheatingReport.create({
            name,
            rollNo,
            department,
            studentClass,
            reason,
            proof: file.url, // Store Cloudinary file URL
        });

        // Send success response
        return res.status(201).json({
            message: "Cheating report submitted successfully!",
            data: cheatingReport,
        });

    } catch (error) {
        console.error("❌ Error adding cheating incident:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const getAllCheatingIncidents = async (req, res) => {
    try {
        const cheatingReports = await CheatingReport.find();
        res.status(200).json(cheatingReports);
    } catch (error) {
        console.error("❌ Error fetching cheating incidents:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const getCheatingIncidentById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid cheating report ID format. Expected a 24-character MongoDB ObjectId." });
        }

        const cheatingReport = await Cheating.findById(id).populate("student", "name rollNo department class"); // Populate student details from User model
        if (!cheatingReport) {
            return res.status(404).json({ message: "Cheating report not found" });
        }

        res.status(200).json(cheatingReport);
    }
    catch (error) {
        console.error("❌ Error fetching cheating incident by ID:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

export const deleteCheatingIncident = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid cheating report ID format. Expected a 24-character MongoDB ObjectId." });
        }

        const cheatingReport = await Cheating.findByIdAndDelete(id);
        if (!cheatingReport) {
            return res.status(404).json({ message: "Cheating report not found" });
        }

        res.status(200).json({ message: "Cheating report deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting cheating incident:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}
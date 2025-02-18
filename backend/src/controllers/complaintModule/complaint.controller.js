import Complaint from "../../models/ComplaintModule/complaint.model.js";

export async function submitComplaint(req, res) {
    try {
        console.log("Received Payload:", req.body); // Debugging Log
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required" });
        }

        const newComplaint = new Complaint({
            title,
            description
        });

        await newComplaint.save();
        res.status(201).json({ message: "Complaint submitted successfully", complaint: newComplaint });
    } catch (error) {
        console.error("Error submitting complaint:", error);
        res.status(500).json({ message: "Error submitting complaint" });
    }
}

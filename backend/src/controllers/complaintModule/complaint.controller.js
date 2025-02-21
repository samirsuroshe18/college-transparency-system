import dotenv from "dotenv";
dotenv.config();
import Complaint from "../../models/ComplaintModule/complaint.model.js";
import axios from "axios";
import { uploadOnCloudinary } from '../../utils/cloudinary.js';

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY; // Ensure this is set in your .env

// 🔥 Function to moderate content using Hugging Face
async function moderateContent(text) {
    try {
        const response = await axios.post(
            "https://api-inference.huggingface.co/models/IMSyPP/profanity-check", // Profanity detection model
            { inputs: text },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${HUGGING_FACE_API_KEY}`
                }
            }
        );

        const prediction = response.data;
        const isProfane = prediction?.[0]?.label === "profane";
        const confidence = prediction?.[0]?.score || 0;

        return { isProfane, confidence };
    } catch (error) {
        console.error("❌ Hugging Face API Error:", error.response?.data || error.message);
        return { isProfane: false, confidence: 0 }; // Default to safe if API fails
    }
}

// 🚀 Updated submitComplaint controller
export async function submitComplaint(req, res) {
    try {
        console.log("📥 Received Payload:", req.body);
        const { title, description, isAnonymous, revealThreshold } = req.body;

        const file = req.file.path;
        const path = await uploadOnCloudinary(file);

        if (!path?.url) {
            throw new ApiError(500, "Failed to upload image ");
        }


        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required" });
        }

        // ⚡ Moderate the description for vulgar/profane content
        const { isProfane, confidence } = await moderateContent(description);

        if (isProfane && confidence > 0.7) { // Threshold of 70% confidence
            return res.status(400).json({
                message: "Your complaint contains inappropriate content.",
                confidence: confidence
            });
        }

        const userId = isAnonymous ? null : req.user?._id;


        const newComplaint = new Complaint({
            title,
            description,
            isAnonymous: isAnonymous || false,
            userId,
            revealThreshold: revealThreshold || 5,
            imagevideo: path.url
        });


        await newComplaint.save();

        res.status(201).json({
            message: "Complaint submitted successfully",
            complaint: {
                id: newComplaint._id,
                title: newComplaint.title,
                description: newComplaint.description,
                isAnonymous: newComplaint.isAnonymous,
                revealThreshold: newComplaint.revealThreshold,
                imagevideo: newComplaint.imagevideo
            }
        });
    } catch (error) {
        console.error("❌ Error submitting complaint:", error);
        res.status(500).json({ message: "Error submitting complaint" });
    }
}

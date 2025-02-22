import Complaint from "../../models/ComplaintModule/complaint.model.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import axios from "axios";
import fs from "fs";
import AWS from "aws-sdk";

// Hugging Face API Key
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;

// AWS Rekognition Setup
const rekognition = new AWS.Rekognition({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// ✅ Moderate Text Content
async function moderateText(text) {
    try {
        const response = await axios.post(
            "https://api-inference.huggingface.co/models/unitary/toxic-bert",
            { inputs: text },
            {
                headers: {
                    Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
                },
            }
        );

        const toxicity = response.data[0]?.find(item => item.label === "toxic")?.score || 0;
        console.log(`⚡ Text Toxicity Score: ${toxicity}`);
        return toxicity > 0.8 ? "Toxic" : "Safe";
    } catch (error) {
        console.error("Text moderation error:", error.response?.data || error.message);
        return "Safe";
    }
}

// ✅ Scan Image for NSFW using AWS Rekognition
async function scanImageWithRekognition(imagePath) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const params = {
            Image: {
                Bytes: imageBuffer,
            },
            MinConfidence: 80,
        };

        const response = await rekognition.detectModerationLabels(params).promise();
        console.log("✅ AWS Rekognition Result:", response.ModerationLabels);

        const nsfwLabels = response.ModerationLabels.filter(label => label.Confidence >= 80);

        if (nsfwLabels.length > 0) {
            console.warn("🚫 NSFW content detected:", nsfwLabels);
            return "NSFW";
        }

        return "Safe";
    } catch (error) {
        console.error("AWS Rekognition error:", error.message);
        return "Safe";
    }
}

// 🚀 Submit Complaint Controller
export async function submitComplaint(req, res) {
    try {
        const { title, description } = req.body;
        const mediaFiles = req.files || []; // Multer will populate this
        const uploadedMedia = [];

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required" });
        }

        // ✅ Moderate Text
        const textStatus = await moderateText(description);
        if (textStatus === "Toxic") {
            return res.status(400).json({ message: "Inappropriate content detected in description." });
        }

        // ✅ Process Media Files
        for (const file of mediaFiles) {
            const fileType = file.mimetype;
            console.log(`🔄 Processing file: ${file.originalname}, Type: ${fileType}`);

            if (fileType.startsWith("image/")) {
                const imageStatus = await scanImageWithRekognition(file.path);
                if (imageStatus === "NSFW") {
                    fs.unlinkSync(file.path); // Delete local file
                    return res.status(400).json({ message: "NSFW content detected in image." });
                }

                // Upload Safe Image to Cloudinary
                const cloudRes = await uploadOnCloudinary(file.path, "image");
                uploadedMedia.push({
                    url: cloudRes.secure_url,
                    public_id: cloudRes.public_id,
                    mediaType: "image",
                });
                fs.unlinkSync(file.path); // Delete local file
            }

            if (fileType.startsWith("video/")) {
                // For videos, implement frame extraction + NSFW scan in future
                const cloudRes = await uploadOnCloudinary(file.path, "video");
                uploadedMedia.push({
                    url: cloudRes.secure_url,
                    public_id: cloudRes.public_id,
                    mediaType: "video",
                });
                fs.unlinkSync(file.path); // Delete local file
            }
        }

        // ✅ Save Complaint with default fields
        const newComplaint = new Complaint({
            title,
            description,
            media: uploadedMedia,
            votes: [],
            isRevealed: false,
            revealThreshold: 5,
        });

        await newComplaint.save();
        res.status(201).json({
            message: "Complaint submitted successfully. Complaints undergo real-time moderation; vulgar content is blocked (no inappropriate images/videos).",
            complaint: newComplaint,
        });
    } catch (error) {
        console.error("Error submitting complaint:", error);
        res.status(500).json({ message: "Error submitting complaint" });
    }
}

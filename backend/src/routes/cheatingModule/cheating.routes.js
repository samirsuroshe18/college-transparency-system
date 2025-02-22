import express from "express";
import {
    addCheatingIncident,  // ✅ Corrected import
    getAllCheatingIncidents,
    getCheatingIncidentById,
    deleteCheatingIncident,
} from "../../controllers/cheatingModule/cheatingModule.controllers.js";


const router = express.Router();

// 📋 Report a new cheating incident
// router.post("/", reportCheating);

// 📄 Get all reported cheating incidents
router.get("/", getAllCheatingIncidents);

// 🔍 Get a specific cheating incident by ID
router.get("/:id", getCheatingIncidentById);

// ❌ Delete a cheating incident
router.delete("/:id", deleteCheatingIncident);

export default router;

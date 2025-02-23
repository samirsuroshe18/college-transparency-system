import express from "express";
import {
    addCheatingIncident,
    getAllCheatingIncidents,
    getCheatingIncidentById,
    deleteCheatingIncident,
} from "../../controllers/cheatingModule/cheatingModule.controllers.js";

import { upload } from "../../middlewares/multer.middleware.js";
import {verifyJwt} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/add-cheating",verifyJwt, upload.single("proof"), addCheatingIncident);
router.get("/get-cheating", getAllCheatingIncidents);

router.route("/") 
    .get(getAllCheatingIncidents)
    .post(addCheatingIncident);

router.route("/:id")
    .get(getCheatingIncidentById)
    .delete(deleteCheatingIncident);

export default router;

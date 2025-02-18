import { Router } from "express";
import { createFacility, getFacilities } from "../controllers/facility.controller.js";
import {verifyJwt} from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create-facilities").post(verifyJwt, createFacility);
router.route("/get-facilities").get(verifyJwt, getFacilities);

export default router;
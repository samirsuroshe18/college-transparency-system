import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import errorHandler from "./utils/errorHandler.js";

const app = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const staticPath = path.join(__dirname, '../public');

// app.use(cors({ origin: ["http://localhost:5173", process.env.CORS_ORIGIN], credentials: true }));
app.use(
    cors(
        {
            origin: 'http://localhost:5173', // Allow frontend origin
            methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
            allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
            credentials: true, // Allow cookies/auth headers if needed
        }
    )
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(staticPath));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";
import complaintRouter from "./routes/complaintModule/complaint.routes.js";
import facilityRouter from "./routes/facilityBookingModule/facility.routes.js";
import bookingRouter from "./routes/facilityBookingModule/booking.routes.js";
import voteRouter from "./routes/electionModule/vote.routes.js";
import adminElectionRouter from "./routes/electionModule/election.routes.js";
import candidateRouter from "./routes/electionModule/candidate.routes.js";
import candidateApplicationRouter from "./routes/electionModule/candidateApplication.routes.js";
import voteRoutes from "./routes/electionModule/vote.routes.js";

//routes declaration
app.use("/api/v1/user", userRouter);
app.use("/api/v1/complaints", complaintRouter);
app.use("/api/v1/facility", facilityRouter);
app.use("/api/v1/booking", bookingRouter);
app.use("/api/v1/votes", voteRouter);
app.use("/api/v1/admin/elections", adminElectionRouter);
app.use("/api/v1/candidates", candidateRouter);
app.use("/api/v1/applications", candidateApplicationRouter);
app.use("/api/v1", voteRoutes);

app.use(errorHandler);

export default app;

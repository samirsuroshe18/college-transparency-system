import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:5173", // Allow frontend origin
        methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
        allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
        credentials: true, // Allow cookies/auth headers if needed
    })
);
app.use(cookieParser());

// Import routes
import complaints from "./routes/complaint.routes.js";
import users from "./routes/user.routes.js";

// Admin Routes
import adminElections from "./routes/election.routes.js"; // Admin controls elections

// Student Routes
import candidateRoutes from "./routes/candidate.routes.js"; // Candidate actions
import voteRoutes from "./routes/vote.routes.js"; // Voting actions

// Use routes
app.use("/api/v1/complaints", complaints);
app.use("/api/v1/users", users);

// Admin Endpoints
app.use("/api/v1/admin/elections", adminElections);

// Student Endpoints
app.use("/api/v1/candidates", candidateRoutes);
app.use("/api/v1/votes", voteRoutes);

export default app;

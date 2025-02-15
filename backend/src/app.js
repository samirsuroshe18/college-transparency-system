import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import complaintRoutes from "./routes/complaint.routes.js";


const app = express();
app.use(express.json());
app.use(
    cors({
        origin: 'http://localhost:5173', // Allow frontend origin
        methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
        allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
        credentials: true, // Allow cookies/auth headers if needed
    })
);
app.use(cookieParser());

app.use("api/v1/complaints", complaintRoutes);

export default app;
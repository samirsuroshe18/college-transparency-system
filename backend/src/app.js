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
import complaintRouter from "./routes/complaint.routes.js";
import facilityRouter from "./routes/facility.routes.js";
import bookingRouter from "./routes/booking.routes.js";

//routes declaration
app.use("/api/v1/user", userRouter);
app.use("/api/v1/complaints", complaintRouter);
app.use("/api/v1/facility", facilityRouter);
app.use("/api/v1/booking", bookingRouter);
app.use(errorHandler);


export default app;

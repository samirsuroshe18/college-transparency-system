import express from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";
import ApiError from './utils/ApiError.js';
import ApiResponse from './utils/ApiResponse.js';
import userRouter from './routes/user.routes.js';
import verifyRouter from './routes/verify.routes.js';
import noticeRouter from './routes/notice.routes.js';
import profileRouter from './routes/profile.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import electionRouter from './routes/election.routes.js';
import complaintRouter from './routes/complaint.routes.js';
import facilityRouter from './routes/facility.routes.js';
import bookingRouter from './routes/booking.routes.js';

const app = express();

// behind the host's proxy the connection's own address is the proxy; this makes
// req.ip the address the proxy saw
app.set('trust proxy', 1);

// allow the frontend origin to send the auth cookies
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/v1/health", (req, res) => {
    return res.status(200).json(new ApiResponse(200, { status: 'ok' }, "OK"));
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/verify", verifyRouter);
app.use("/api/v1/notices", noticeRouter);
app.use("/api/v1/profiles", profileRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/elections", electionRouter);
app.use("/api/v1/complaints", complaintRouter);
app.use("/api/v1/facilities", facilityRouter);
app.use("/api/v1/bookings", bookingRouter);

app.use((req, res, next) => {
    next(new ApiError(404, "Route not found"));
});

// Custom error handling
app.use((err, req, res, next) => {
    const isValidationError = err.name === 'ValidationError';
    const statusCode = err.statusCode || (isValidationError ? 400 : 500);
    // an unexpected failure can carry database or stack details, so only messages
    // written for the client (ApiError) or for a 4xx are sent back
    const isUnexpected = statusCode >= 500 && !(err instanceof ApiError);
    const message = isUnexpected ? "Internal server error" : (err.message || "Internal server error");

    if (statusCode >= 500) {
        console.log(err);
    }

    return res.status(statusCode).json({
        statusCode: statusCode,
        message: message,
        success: false
    });
})

export default app

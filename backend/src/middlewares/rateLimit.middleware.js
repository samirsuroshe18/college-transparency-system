import { rateLimit } from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';

const WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_LIMIT = 30;

// The API sits behind the web app's proxy and the host's own, so the connection never
// comes from the visitor directly; the first forwarded address is the visitor.
const visitorOf = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';

    return first || req.ip || 'unknown';
};

// Limits sign-up, login and password reset per visitor. The automated tests switch it
// on by setting ACCOUNT_RATE_LIMIT; otherwise it would get in the way of every test.
const accountLimiter = rateLimit({
    windowMs: WINDOW_MS,
    limit: Number(process.env.ACCOUNT_RATE_LIMIT) || DEFAULT_LIMIT,
    keyGenerator: visitorOf,
    skip: () => process.env.NODE_ENV === 'test' && !process.env.ACCOUNT_RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    handler: (req, res, next) => next(new ApiError(429, "Too many attempts. Please try again in a few minutes.")),
});

export { accountLimiter }

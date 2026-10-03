import { rateLimit } from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';

const WINDOW_MS = 15 * 60 * 1000;
const TOO_MANY = "Too many attempts. Please try again in a few minutes.";

// The automated tests switch the limits on by setting ACCOUNT_RATE_LIMIT; otherwise
// they would get in the way of every test.
const skippedInTests = () => process.env.NODE_ENV === 'test' && !process.env.ACCOUNT_RATE_LIMIT;

const setting = (name, fallback) => () => Number(process.env[name]) || fallback;

const limiter = (limit, keyGenerator, skip = skippedInTests) => rateLimit({
    windowMs: WINDOW_MS,
    limit,
    keyGenerator,
    skip,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    handler: (req, res, next) => next(new ApiError(429, TOO_MANY)),
});

// The API sits behind the web app's proxy and the host's own. The first forwarded
// address is the visitor when the request came through the web app.
const visitorOf = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';

    return first || req.ip || 'unknown';
};

// That header can be made up by someone who calls the API directly. The address the
// request really arrived from cannot, and neither can the email address it is about,
// so each of those has a limit of its own.
const emailOf = (req) => (typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '');

const byVisitor = limiter(setting('ACCOUNT_RATE_LIMIT', 30), visitorOf);
const byConnection = limiter(setting('ACCOUNT_CONNECTION_RATE_LIMIT', 120), (req) => `connection:${req.ip}`);
const byEmail = limiter(
    setting('ACCOUNT_EMAIL_RATE_LIMIT', 10),
    (req) => `email:${emailOf(req)}`,
    (req) => skippedInTests() || !emailOf(req)
);

// sign-up, login and password reset: they can send email or test a password
const accountLimiter = [byVisitor, byConnection, byEmail];

// The demo accounts are shared by every visitor, so limits for logged-in users are
// kept per user and visitor: one visitor cannot use up the allowance of the others.
const userAndVisitor = (prefix) => (req) => `${prefix}:${req.user?._id}:${visitorOf(req)}`;

// forms that can carry a file; use after verifyJwt
const profileLimiter = limiter(setting('PROFILE_RATE_LIMIT', 10), userAndVisitor('form'));

// Everything that changes something in the modules; reading is not limited.
// Use after verifyJwt.
const writeLimiter = limiter(
    setting('WRITE_RATE_LIMIT', 60),
    userAndVisitor('write'),
    (req) => skippedInTests() || req.method === 'GET'
);

export { accountLimiter, profileLimiter, writeLimiter }

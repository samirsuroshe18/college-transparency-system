import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { verifyJwt, requireApproved, requireRole } from '../src/middlewares/auth.middleware.js';
import { createUser } from './helpers.js';

// a small app with one route behind each guard
const app = express();
app.use(cookieParser());
app.get('/approved', verifyJwt, requireApproved, (req, res) => res.json({ ok: true }));
app.get('/admin', verifyJwt, requireApproved, requireRole('admin'), (req, res) => res.json({ ok: true }));
app.get('/staff', verifyJwt, requireApproved, requireRole('admin', 'faculty'), (req, res) => res.json({ ok: true }));
app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ message: err.message }));

const as = (user, path) => request(app).get(path).set('Authorization', `Bearer ${user.generateAccessToken()}`);

describe('requireApproved', () => {
    test('refuses a profile that is not filled, pending or rejected, each with its own message', async () => {
        const cases = {
            NotFilled: 'Complete your profile first',
            Pending: 'Your profile is waiting for approval',
            Rejected: 'Your profile was rejected',
        };

        for (const [profileStatus, message] of Object.entries(cases)) {
            const res = await as(await createUser({ profileStatus }), '/approved');
            expect(res.status).toBe(403);
            expect(res.body.message).toBe(message);
        }
    });

    test('lets an approved student or faculty member through', async () => {
        expect((await as(await createUser(), '/approved')).status).toBe(200);
        expect((await as(await createUser({ role: 'faculty' }), '/approved')).status).toBe(200);
    });

    test('admin and doctor accounts need no approval', async () => {
        expect((await as(await createUser({ role: 'admin', profileStatus: 'NotFilled' }), '/approved')).status).toBe(200);
        expect((await as(await createUser({ role: 'doctor', profileStatus: 'NotFilled' }), '/approved')).status).toBe(200);
    });

    test('no login is a 401 before anything else', async () => {
        expect((await request(app).get('/approved')).status).toBe(401);
    });
});

describe('requireRole', () => {
    test('refuses another role', async () => {
        for (const role of ['student', 'faculty', 'doctor']) {
            const res = await as(await createUser({ role }), '/admin');
            expect(res.status).toBe(403);
            expect(res.body.message).toBe('You are not allowed to do this');
        }
    });

    test('lets any of the listed roles through', async () => {
        expect((await as(await createUser({ role: 'admin' }), '/admin')).status).toBe(200);
        expect((await as(await createUser({ role: 'faculty' }), '/staff')).status).toBe(200);
        expect((await as(await createUser({ role: 'student' }), '/staff')).status).toBe(403);
    });
});

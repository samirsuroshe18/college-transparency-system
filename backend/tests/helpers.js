import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';

let counter = 0;

// a verified student with an approved profile, unless told otherwise
export const createUser = async (overrides = {}) => {
    counter += 1;
    return User.create({
        name: 'Test User',
        email: `user${counter}@test.dev`,
        password: 'secret12',
        isVerified: true,
        role: 'student',
        profileStatus: 'Approved',
        ...overrides,
    });
};

// the account tests were written with this name
export const createVerifiedUser = createUser;

export const createAdmin = (overrides = {}) => createUser({ role: 'admin', name: 'Admin User', ...overrides });

// returns a supertest agent that keeps the auth cookies
export const loginAgent = async (user, password = 'secret12') => {
    const agent = request.agent(app);
    const res = await agent.post('/api/v1/users/login').send({ email: user.email, password });
    if (res.status !== 200) {
        throw new Error(`Login failed: ${res.status} ${res.body.message}`);
    }
    return agent;
};

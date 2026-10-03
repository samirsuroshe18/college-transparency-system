import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { acceptFile } from '../src/middlewares/upload.middleware.js';
import { storeFile, uploadsEnabled } from '../src/utils/uploads.js';

const KEYS = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const MB = 1024 * 1024;

// a small app with one upload route that reports what arrived
const app = express();
app.post('/upload', acceptFile('document'), (req, res) => {
    res.json({ title: req.body.title, file: req.file ? { size: req.file.size, type: req.file.mimetype, hasBuffer: Buffer.isBuffer(req.file.buffer) } : null });
});
app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ message: err.message }));

const send = (buffer, filename, contentType) =>
    request(app).post('/upload').field('title', 'A form field').attach('document', buffer, { filename, contentType });

const enable = () => KEYS.forEach((key) => { process.env[key] = 'set'; });
const disable = () => KEYS.forEach((key) => delete process.env[key]);

afterEach(disable);

describe('acceptFile', () => {
    test('accepts an image and keeps it in memory', async () => {
        const res = await send(Buffer.alloc(1000), 'proof.png', 'image/png');

        expect(res.status).toBe(200);
        expect(res.body.file).toEqual({ size: 1000, type: 'image/png', hasBuffer: true });
        expect(res.body.title).toBe('A form field');
    });

    test('accepts JPEG, WebP and PDF', async () => {
        for (const [name, type] of [['a.jpg', 'image/jpeg'], ['a.webp', 'image/webp'], ['a.pdf', 'application/pdf']]) {
            expect((await send(Buffer.alloc(10), name, type)).status).toBe(200);
        }
    });

    test('refuses other kinds of file', async () => {
        for (const [name, type] of [['run.exe', 'application/octet-stream'], ['notes.txt', 'text/plain'], ['page.html', 'text/html'], ['pic.svg', 'image/svg+xml']]) {
            const res = await send(Buffer.alloc(10), name, type);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Only images (JPEG, PNG, WebP) and PDF files are allowed');
        }
    });

    test('refuses a file over 2 MB and accepts one of exactly 2 MB', async () => {
        const tooBig = await send(Buffer.alloc(2 * MB + 1), 'big.png', 'image/png');
        const atLimit = await send(Buffer.alloc(2 * MB), 'limit.png', 'image/png');

        expect(tooBig.status).toBe(400);
        expect(tooBig.body.message).toBe('The file must be 2 MB or smaller');
        expect(atLimit.status).toBe(200);
    });

    test('a form without a file goes through', async () => {
        const res = await request(app).post('/upload').field('title', 'No attachment');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ title: 'No attachment', file: null });
    });
});

describe('storeFile', () => {
    const file = { buffer: Buffer.from('data'), mimetype: 'image/png', originalname: 'proof.png' };

    test('uploads are enabled only when all three settings are present', () => {
        expect(uploadsEnabled()).toBe(false);
        process.env.CLOUDINARY_CLOUD_NAME = 'set';
        expect(uploadsEnabled()).toBe(false);
        enable();
        expect(uploadsEnabled()).toBe(true);
    });

    test('returns the address the file was stored at', async () => {
        enable();
        const uploader = jest.fn(async () => 'https://files.example/proof.png');

        const url = await storeFile(file, 'profiles', { uploader });

        expect(url).toBe('https://files.example/proof.png');
        expect(uploader).toHaveBeenCalledWith(file.buffer, 'college-transparency/profiles');
    });

    test('returns null when there is no file', async () => {
        enable();
        const uploader = jest.fn();

        expect(await storeFile(undefined, 'profiles', { uploader })).toBeNull();
        expect(uploader).not.toHaveBeenCalled();
    });

    test('returns null without uploading when uploads are not set up', async () => {
        const uploader = jest.fn();

        expect(await storeFile(file, 'profiles', { uploader })).toBeNull();
        expect(uploader).not.toHaveBeenCalled();
    });

    test('a failed upload is reported with a message the user can act on', async () => {
        enable();
        const silenced = jest.spyOn(console, 'log').mockImplementation(() => {});
        const uploader = async () => { throw new Error('cloud is down'); };

        await expect(storeFile(file, 'profiles', { uploader })).rejects.toMatchObject({
            statusCode: 502,
            message: 'The file could not be stored. Try again without it.',
        });
        silenced.mockRestore();
    });
});

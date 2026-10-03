import { jest } from '@jest/globals';
import { readBoolean, readChoice, readDate, readText } from '../src/utils/input.js';
import { assertReach } from '../src/utils/reach.js';
import { sendMail } from '../src/utils/mailSender.js';

const failure = (fn) => {
    try {
        fn();
    } catch (error) {
        return { status: error.statusCode, message: error.message };
    }
    return null;
};

describe('readText', () => {
    test('trims text and accepts a number as text', () => {
        expect(readText('  hello  ', 'Title')).toBe('hello');
        expect(readText(42, 'Title')).toBe('42');
    });

    test('an empty or missing value is an empty string unless required', () => {
        expect(readText(undefined, 'Title')).toBe('');
        expect(readText(null, 'Title')).toBe('');
        expect(readText('   ', 'Title')).toBe('');
        expect(failure(() => readText('   ', 'Title', { required: true }))).toEqual({ status: 400, message: 'Title is required' });
        expect(failure(() => readText(undefined, 'Title', { required: true }))).toEqual({ status: 400, message: 'Title is required' });
    });

    test('refuses objects, lists and booleans', () => {
        for (const value of [{ $ne: null }, ['a'], true]) {
            expect(failure(() => readText(value, 'Title'))).toEqual({ status: 400, message: 'Title must be text' });
        }
    });

    test('has a default limit of 200 characters and takes another', () => {
        expect(readText('a'.repeat(200), 'Title')).toHaveLength(200);
        expect(failure(() => readText('a'.repeat(201), 'Title'))).toEqual({ status: 400, message: 'Title must be at most 200 characters' });
        expect(failure(() => readText('a'.repeat(11), 'Note', { max: 10 }))).toEqual({ status: 400, message: 'Note must be at most 10 characters' });
    });
});

describe('readChoice', () => {
    test('accepts a listed value and refuses another', () => {
        expect(readChoice('event', 'Category', ['event', 'budget'])).toBe('event');
        expect(failure(() => readChoice('party', 'Category', ['event', 'budget']))).toEqual({ status: 400, message: 'Category must be one of: event, budget' });
    });

    test('a missing value is undefined unless required', () => {
        expect(readChoice('', 'Category', ['event'])).toBeUndefined();
        expect(failure(() => readChoice('', 'Category', ['event'], { required: true }))).toEqual({ status: 400, message: 'Category is required' });
    });
});

describe('readDate', () => {
    test('reads a date and refuses what is not one', () => {
        expect(readDate('2026-11-05T10:00:00Z', 'Deadline')).toEqual(new Date('2026-11-05T10:00:00Z'));
        expect(failure(() => readDate('next week', 'Deadline'))).toEqual({ status: 400, message: 'Deadline must be a date' });
    });

    test('a missing value is undefined unless required', () => {
        expect(readDate('', 'Deadline')).toBeUndefined();
        expect(failure(() => readDate(undefined, 'Deadline', { required: true }))).toEqual({ status: 400, message: 'Deadline is required' });
    });
});

describe('readBoolean', () => {
    test('true and the form value "true" are true; everything else is false', () => {
        expect(readBoolean(true)).toBe(true);
        expect(readBoolean('true')).toBe(true);
        for (const value of [false, 'false', '', undefined, null, 1, 'yes', {}]) {
            expect(readBoolean(value)).toBe(false);
        }
    });
});

describe('assertReach', () => {
    const demo = { isDemo: true };
    const real = { isDemo: false };

    test('a demo account cannot change what a real user made', () => {
        expect(failure(() => assertReach(demo, { isDemo: false }))).toEqual({ status: 403, message: 'Demo accounts can only change sample data' });
        expect(failure(() => assertReach(demo, {}))).toEqual({ status: 403, message: 'Demo accounts can only change sample data' });
    });

    test('a demo account can change sample data, and a real account can change anything', () => {
        expect(failure(() => assertReach(demo, { isDemo: true }))).toBeNull();
        expect(failure(() => assertReach(real, { isDemo: true }))).toBeNull();
        expect(failure(() => assertReach(real, { isDemo: false }))).toBeNull();
    });
});

describe('sendMail', () => {
    const realFetch = global.fetch;

    afterEach(() => {
        delete process.env.BREVO_API_KEY;
        delete process.env.MAIL_FROM;
        global.fetch = realFetch;
    });

    test('sends a plain message through the mail service and reports success', async () => {
        process.env.BREVO_API_KEY = 'test-key';
        process.env.MAIL_FROM = 'hello@college.test';
        global.fetch = jest.fn(async () => ({ ok: true, status: 201, json: async () => ({}) }));

        const sent = await sendMail('asha@example.com', 'Your application was approved', 'Well done.\nSee the portal.');

        expect(sent).toBe(true);
        const body = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(body.to).toEqual([{ email: 'asha@example.com' }]);
        expect(body.subject).toBe('Your application was approved');
        expect(body.htmlContent).toContain('Well done.<br>See the portal.');
    });

    test('text is escaped, so a message cannot carry markup', async () => {
        process.env.BREVO_API_KEY = 'test-key';
        global.fetch = jest.fn(async () => ({ ok: true, status: 201, json: async () => ({}) }));

        await sendMail('asha@example.com', 'Decision', 'Comment: <script>alert(1)</script> & more');

        const body = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(body.htmlContent).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; more');
        expect(body.htmlContent).not.toContain('<script>');
    });

    test('a failure is reported as false, not thrown', async () => {
        process.env.BREVO_API_KEY = 'test-key';
        global.fetch = jest.fn(async () => { throw new Error('network down'); });
        const silenced = jest.spyOn(console, 'log').mockImplementation(() => {});

        expect(await sendMail('asha@example.com', 'Decision', 'Text')).toBe(false);
        silenced.mockRestore();
    });
});

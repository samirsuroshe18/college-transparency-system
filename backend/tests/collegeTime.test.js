import { collegeDayFromNow, collegeToday, endOfCollegeDay } from '../src/utils/collegeTime.js';
import { stageOf } from '../src/utils/electionStage.js';

// the college is in India unless told otherwise: five and a half hours ahead of UTC
afterEach(() => {
    delete process.env.COLLEGE_UTC_OFFSET_MINUTES;
});

describe('collegeToday', () => {
    test('is the calendar day at the college, not in UTC', () => {
        // 18:29 UTC is 23:59 in India, still the 12th; a minute later it is the 13th there
        expect(collegeToday(new Date('2026-11-12T18:29:00Z'))).toBe('2026-11-12');
        expect(collegeToday(new Date('2026-11-12T18:30:00Z'))).toBe('2026-11-13');
        expect(collegeToday(new Date('2026-11-12T00:00:00Z'))).toBe('2026-11-12');
    });

    test('follows COLLEGE_UTC_OFFSET_MINUTES', () => {
        process.env.COLLEGE_UTC_OFFSET_MINUTES = '-300';
        expect(collegeToday(new Date('2026-11-12T04:59:00Z'))).toBe('2026-11-11');
        expect(collegeToday(new Date('2026-11-12T05:00:00Z'))).toBe('2026-11-12');

        process.env.COLLEGE_UTC_OFFSET_MINUTES = '0';
        expect(collegeToday(new Date('2026-11-12T23:59:59Z'))).toBe('2026-11-12');
    });

    test('a setting that is not a number falls back to India', () => {
        process.env.COLLEGE_UTC_OFFSET_MINUTES = 'soon';
        expect(collegeToday(new Date('2026-11-12T18:30:00Z'))).toBe('2026-11-13');
    });
});

describe('collegeDayFromNow', () => {
    test('counts whole days from the college\'s today', () => {
        const now = new Date('2026-11-12T20:00:00Z'); // the 13th at the college
        expect(collegeDayFromNow(0, now)).toBe('2026-11-13');
        expect(collegeDayFromNow(2, now)).toBe('2026-11-15');
        expect(collegeDayFromNow(-13, now)).toBe('2026-10-31');
    });
});

describe('endOfCollegeDay', () => {
    test('is the last moment of the named day at the college', () => {
        // the day is named by a date as the forms send it: 2026-11-12, stored as midnight UTC
        expect(endOfCollegeDay(new Date('2026-11-12T00:00:00Z'))).toEqual(new Date('2026-11-12T18:29:59.999Z'));
    });

    test('follows the offset', () => {
        process.env.COLLEGE_UTC_OFFSET_MINUTES = '0';
        expect(endOfCollegeDay(new Date('2026-11-12T00:00:00Z'))).toEqual(new Date('2026-11-12T23:59:59.999Z'));
    });
});

describe('a voting day ends when the day ends at the college', () => {
    const election = { applicationDeadline: new Date('2026-11-10T06:30:00Z'), votingDay: new Date('2026-11-12T00:00:00Z') };

    test('voting is open in the last minute of the day and closed in the first of the next', () => {
        expect(stageOf(election, new Date('2026-11-12T18:29:30Z'))).toBe('voting');
        expect(stageOf(election, new Date('2026-11-12T18:30:00Z'))).toBe('closed');
    });
});

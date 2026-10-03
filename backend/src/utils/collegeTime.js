// A "day" in this system is a day at the college, wherever the server runs. The
// college's distance from UTC is set in minutes; the default is India (UTC+5:30).
const DEFAULT_OFFSET_MINUTES = 330;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

// no place on earth is further than 14 hours from UTC
const MAX_OFFSET_MINUTES = 14 * 60;

const offsetMs = () => {
    const setting = (process.env.COLLEGE_UTC_OFFSET_MINUTES || '').trim();
    const configured = Number(setting);
    const usable = setting !== '' && Number.isFinite(configured) && Math.abs(configured) <= MAX_OFFSET_MINUTES;

    return (usable ? configured : DEFAULT_OFFSET_MINUTES) * MINUTE_MS;
};

// the calendar day it is at the college, as YYYY-MM-DD
const collegeToday = (now = new Date()) => new Date(now.getTime() + offsetMs()).toISOString().slice(0, 10);

// the college's day a number of days from today
const collegeDayFromNow = (days, now = new Date()) => collegeToday(new Date(now.getTime() + days * DAY_MS));

// The last moment of a calendar day at the college. The day is named by a date the way
// forms send it ("2026-11-12", stored as midnight UTC).
const endOfCollegeDay = (date) => {
    const day = new Date(date);
    const endInUtc = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 23, 59, 59, 999);

    return new Date(endInUtc - offsetMs());
};

export { collegeToday, collegeDayFromNow, endOfCollegeDay }

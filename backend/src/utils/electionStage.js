import { endOfCollegeDay } from './collegeTime.js';

// a voting day ends when that day ends at the college
const endOfDay = endOfCollegeDay;

// Where an election is. Students apply until the deadline; voting runs from the
// deadline to the end of the voting day at the college; after that, or once an admin has ended it,
// the election is closed.
const stageOf = (election, now = new Date()) => {
    if (election.endedAt) return 'closed';
    if (now < new Date(election.applicationDeadline)) return 'applications';
    if (now <= endOfDay(election.votingDay)) return 'voting';
    return 'closed';
};

// Students may stand and vote when they match every rule the election sets
const isEligible = (election, user) => {
    if (user.role !== 'student') return false;

    const rules = election.eligibility || {};

    return (!rules.department || rules.department === user.department)
        && (!rules.year || rules.year === user.currentYear)
        && (!rules.division || rules.division === user.classDivision);
};

export { endOfDay, stageOf, isEligible }

import ApiError from './ApiError.js';

// The demo accounts are public: anyone can log in as them. They can try everything on
// the sample college, and change nothing that a real person made. Reading is not
// limited; real accounts are not limited either.
const assertReach = (actor, document) => {
    if (actor.isDemo && !document.isDemo) {
        throw new ApiError(403, "Demo accounts can only change sample data");
    }
};

export { assertReach }

import { Filter } from 'bad-words';

const filter = new Filter();

// whether a text contains words that have no place in a complaint
const hasOffensiveLanguage = (text) => (typeof text === 'string' && text ? filter.isProfane(text) : false);

export { hasOffensiveLanguage }

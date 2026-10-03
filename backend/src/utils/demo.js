// The sample college lives under this address, and its roll numbers and faculty IDs
// under this prefix. Real accounts can use neither, so the two never collide.
const DEMO_DOMAIN = '@campus.demo';
const DEMO_ID_PREFIX = 'DEMO-';

const isDemoEmail = (email) => typeof email === 'string' && email.toLowerCase().endsWith(DEMO_DOMAIN);

const isReservedId = (value) => typeof value === 'string' && value.toUpperCase().startsWith(DEMO_ID_PREFIX);

export { DEMO_DOMAIN, DEMO_ID_PREFIX, isDemoEmail, isReservedId }

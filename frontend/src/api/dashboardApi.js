import api, { unwrap } from './client.js';

// { role, unreadNotices, cards: [{ key, label, value, link }] }
export const getDashboard = async () => unwrap(await api.get('/dashboard')).data;

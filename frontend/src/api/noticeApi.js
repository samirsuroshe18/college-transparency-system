import api, { unwrap } from './client.js';

// { notices, unread }
export const getNotices = async () => unwrap(await api.get('/notices')).data;

export const markNoticeRead = async (id) => unwrap(await api.patch(`/notices/${id}/read`));

export const markAllNoticesRead = async () => unwrap(await api.patch('/notices/read-all'));

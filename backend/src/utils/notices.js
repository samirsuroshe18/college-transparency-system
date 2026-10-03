import { Notice } from '../models/notice.model.js';

// Leaves a notice for one user. The notice is { type, title, body, link }.
const notify = (userId, notice) => Notice.create({ ...notice, user: userId });

// the same notice for several users
const notifyMany = (userIds, notice) =>
    Notice.insertMany(userIds.map((userId) => ({ ...notice, user: userId })));

export { notify, notifyMany }

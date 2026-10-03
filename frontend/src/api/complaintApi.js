import api, { unwrap } from './client.js';

// Each complaint arrives as this user may see it: an anonymous author is null until the
// board has voted to reveal the name.
export const listComplaints = async () => unwrap(await api.get('/complaints')).data.complaints;

// form: { title, description, isAnonymous }, with an optional document
export const submitComplaint = async (form, document) => {
  const body = new FormData();
  body.append('title', form.title);
  body.append('description', form.description);
  body.append('isAnonymous', form.isAnonymous ? 'true' : 'false');
  if (document) body.append('document', document);

  return unwrap(await api.post('/complaints', body));
};

// value is "up", "down" or "none"
export const voteOnComplaint = async (id, value) => unwrap(await api.post(`/complaints/${id}/vote`, { value }));

export const voteToReveal = async (id) => unwrap(await api.post(`/complaints/${id}/reveal-vote`));

export const resolveComplaint = async (id, note) => unwrap(await api.patch(`/complaints/${id}/resolve`, { note }));

import api, { unwrap } from './client.js';

// filters: { mine: true } for the caller's own applications
export const listApplications = async (filters = {}) => unwrap(await api.get('/applications', { params: filters })).data.applications;

// form: { title, description, category }, with an optional file
export const submitApplication = async (form, file) => {
  const body = new FormData();
  body.append('title', form.title);
  body.append('description', form.description);
  body.append('category', form.category);
  if (file) body.append('file', file);

  return unwrap(await api.post('/applications', body));
};

// a faculty member's opinion before the decision
export const reviewApplication = async (id, comment) => unwrap(await api.patch(`/applications/${id}/review`, { comment }));

// status is "approved" or "rejected"; a rejection needs a comment
export const decideApplication = async (id, status, comment) => unwrap(await api.patch(`/applications/${id}/decision`, { status, comment }));

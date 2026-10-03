import api, { unwrap } from './client.js';

// a student gets their own concerns, the doctor gets everyone's
export const listConcerns = async () => unwrap(await api.get('/health-concerns')).data.concerns;

// form: { symptoms, description, urgency }, with an optional file
export const reportConcern = async (form, file) => {
  const body = new FormData();
  body.append('symptoms', form.symptoms);
  body.append('description', form.description);
  body.append('urgency', form.urgency);
  if (file) body.append('attachment', file);

  return unwrap(await api.post('/health-concerns', body));
};

// the doctor's answer; leaveDays is 0 when no leave is given
export const assessConcern = async (id, diagnosis, leaveDays) =>
  unwrap(await api.patch(`/health-concerns/${id}/assess`, { diagnosis, leaveDays }));

// { leaves, today }: who is away and for which days, without anything medical
export const listLeaves = async () => unwrap(await api.get('/leaves')).data;

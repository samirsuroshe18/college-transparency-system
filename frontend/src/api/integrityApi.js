import api, { unwrap } from './client.js';

export const listRecords = async () => unwrap(await api.get('/integrity')).data.records;

// form: { rollNumber, reason }, with an optional proof file
export const addRecord = async (form, proof) => {
  const body = new FormData();
  body.append('rollNumber', form.rollNumber);
  body.append('reason', form.reason);
  if (proof) body.append('proof', proof);

  return unwrap(await api.post('/integrity', body));
};

export const removeRecord = async (id) => unwrap(await api.delete(`/integrity/${id}`));

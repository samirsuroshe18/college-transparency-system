import api, { unwrap } from './client.js';

// Each function returns the server's answer ({ data, message }) and throws on failure,
// so the page decides what to show.

export const register = async (form) => unwrap(await api.post('/users/register', form));

export const login = async (email, password) => unwrap(await api.post('/users/login', { email, password }));

export const logout = async () => unwrap(await api.get('/users/logout'));

export const getMe = async () => unwrap(await api.get('/users/me'));

export const forgotPassword = async (email) => unwrap(await api.post('/users/forgot-password', { email }));

export const verifyEmail = async (token) => unwrap(await api.get('/verify/verify-email', { params: { token } }));

export const checkResetToken = async (token) => unwrap(await api.get('/verify/reset-password', { params: { token } }));

export const setNewPassword = async (token, password, confirmPassword) =>
  unwrap(await api.post('/verify/verify-password', { password, confirmPassword }, { params: { token } }));

// A profile form is sent as multipart so that an ID proof can go with it.
// Empty values are left out; the emergency contact travels as one JSON field.
const toFormData = (fields, idProof) => {
  const form = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue;
    form.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
  }

  if (idProof) form.append('idProof', idProof);

  return form;
};

export const submitStudentProfile = async (fields, idProof) =>
  unwrap(await api.post('/profiles/student', toFormData(fields, idProof)));

export const submitFacultyProfile = async (fields, idProof) =>
  unwrap(await api.post('/profiles/faculty', toFormData(fields, idProof)));

export const getPendingProfiles = async () => unwrap(await api.get('/profiles/pending'));

export const getApprovedFaculty = async () => unwrap(await api.get('/profiles/faculty'));

export const approveProfile = async (userId) => unwrap(await api.patch(`/profiles/${userId}/approve`));

export const rejectProfile = async (userId, reason) => unwrap(await api.patch(`/profiles/${userId}/reject`, { reason }));

export const setDuties = async (userId, duties) => unwrap(await api.patch(`/profiles/${userId}/duties`, duties));

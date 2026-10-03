import api, { unwrap } from './client.js';

export const listFacilities = async () => unwrap(await api.get('/facilities')).data.facilities;

export const createFacility = async (form) => unwrap(await api.post('/facilities', form));

// changes only what is sent: { name, description, location, available }
export const updateFacility = async (id, changes) => unwrap(await api.patch(`/facilities/${id}`, changes));

// filters: { mine: true } for the caller's own requests, { facility: id } for one facility
export const listBookings = async (filters = {}) => unwrap(await api.get('/bookings', { params: filters })).data.bookings;

// form: { facility, date: "YYYY-MM-DD", startTime: "HH:MM", endTime: "HH:MM", purpose }
export const requestBooking = async (form) => unwrap(await api.post('/bookings', form));

// status is "approved" or "rejected"; a rejection needs a reason
export const decideBooking = async (id, status, reason) => unwrap(await api.patch(`/bookings/${id}`, { status, reason }));

export const cancelBooking = async (id) => unwrap(await api.delete(`/bookings/${id}`));

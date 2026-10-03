import api, { unwrap } from './client.js';

// each election comes with its stage: "applications", "voting" or "closed"
export const listElections = async () => unwrap(await api.get('/elections')).data.elections;

// { election, candidates, myCandidacy, winners, eligible, hasVoted }
export const getElection = async (id) => unwrap(await api.get(`/elections/${id}`)).data;

export const createElection = async (form) => unwrap(await api.post('/elections', form));

export const endElection = async (id) => unwrap(await api.patch(`/elections/${id}/end`));

export const applyAsCandidate = async (id, form) => unwrap(await api.post(`/elections/${id}/candidates`, form));

// status is "Approved" or "Rejected"
export const decideCandidate = async (id, candidateId, status) =>
  unwrap(await api.patch(`/elections/${id}/candidates/${candidateId}`, { status }));

export const castVote = async (id, candidateId) => unwrap(await api.post(`/elections/${id}/vote`, { candidateId }));

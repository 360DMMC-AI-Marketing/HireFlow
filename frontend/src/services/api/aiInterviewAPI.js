import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE = `${API}/v1/ai-interviews`;

// Helper: attach JWT
const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const createAIInterview = (data) =>
  axios.post(BASE, data, auth());

export const getAIInterview = (id) =>
  axios.get(`${BASE}/${id}`, auth());

export const getAIInterviewsByJob = (jobId) =>
  axios.get(`${BASE}/job/${jobId}`, auth());

export const getAIInterviewsByCandidate = (candidateId) =>
  axios.get(`${BASE}/candidate/${candidateId}`, auth());

export const deleteAIInterview = (id) =>
  axios.delete(`${BASE}/${id}`, auth());

export const generateMagicLink = (id) =>
  axios.post(`${BASE}/${id}/magic-link`, {}, auth());

export const getAnalysis = (id) =>
  axios.get(`${BASE}/${id}/analysis`, auth());

export const getResumeComparison = (id) =>
  axios.get(`${BASE}/${id}/comparison`, auth());

export const getCandidateRankings = (jobId) =>
  axios.get(`${BASE}/job/${jobId}/rankings`, auth());

export const getQuestionBank = (params) =>
  axios.get(`${BASE}/questions/bank`, { ...auth(), params });

export const createQuestion = (data) =>
  axios.post(`${BASE}/questions/bank`, data, auth());

export const updateQuestion = (id, data) =>
  axios.put(`${BASE}/questions/bank/${id}`, data, auth());

export const deleteQuestion = (id) =>
  axios.delete(`${BASE}/questions/bank/${id}`, auth());

// Public (no auth)
export const joinViaToken = (magicToken) =>
  axios.get(`${BASE}/join/${magicToken}`);
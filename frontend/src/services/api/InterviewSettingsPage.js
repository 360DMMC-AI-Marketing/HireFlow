// frontend/src/services/api/interviewApi.js
import api from '../../utils/axios';

// ─── SLOT MANAGEMENT ─────────────────────────────────────────────────────────

// Create availability slot (recruiter)
export const createInterviewSlot = async (slotData) => {
  const response = await api.post('/interviews/slots', slotData);
  return response.data;
};

// Get recruiter's own slots
export const getRecruiterSlots = async () => {
  const response = await api.get('/interviews/slots/me');
  return response.data;
};

// Delete a slot
export const deleteInterviewSlot = async (slotId) => {
  const response = await api.delete(`/interviews/slots/${slotId}`);
  return response.data;
};

// Get available slots for a job (public)
export const getAvailableSlots = async (jobId, timezone) => {
  const params = {};
  if (jobId) params.jobId = jobId;
  if (timezone) params.timezone = timezone;
  const response = await api.get('/interviews/slots', { params });
  return response.data;
};

// ─── INTERVIEW MANAGEMENT ────────────────────────────────────────────────────

// Get all interviews
export const getInterviews = async (filters = {}) => {
  const response = await api.get('/interviews', { params: filters });
  return response.data;
};

// Get single interview
export const getInterviewById = async (id) => {
  const response = await api.get(`/interviews/${id}`);
  return response.data;
};

// Book a slot
export const bookInterview = async ({ candidateId, slotId, jobId }) => {
  const response = await api.post('/interviews/book', { candidateId, slotId, jobId });
  return response.data;
};

// Cancel interview
export const cancelInterview = async (id, reason) => {
  const response = await api.patch(`/interviews/${id}/cancel`, { reason });
  return response.data;
};

// Reschedule interview
export const rescheduleInterview = async (id, newSlotId) => {
  const response = await api.patch(`/interviews/${id}/reschedule`, { newSlotId });
  return response.data;
};

// Add feedback
export const addInterviewFeedback = async (id, data) => {
  const response = await api.patch(`/interviews/${id}/feedback`, data);
  return response.data;
};

// ─── GOOGLE CALENDAR ─────────────────────────────────────────────────────────

export const connectGoogleCalendar = () => {
  window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`;
};

// ─── MAGIC LINK GENERATION ───────────────────────────────────────────────────

// Generate a magic link for a candidate (recruiter action)
export const generateMagicLink = async (candidateId, jobId) => {
  const response = await api.post('/interviews/magic-link', { candidateId, jobId });
  return response.data;
};

// ─── PUBLIC SCHEDULING (Magic Links) ─────────────────────────────────────────

// Validate a scheduling token (no auth needed)
export const validateScheduleToken = async (token) => {
  const response = await api.get(`/schedule/${token}`);
  return response.data;
};

// Book via magic link (no auth needed)
export const bookViaToken = async (token, slotId) => {
  const response = await api.post(`/schedule/${token}/book`, { slotId });
  return response.data;
};
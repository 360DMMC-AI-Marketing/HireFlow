// Application constants
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  CANDIDATES: '/dashboard/candidates',
  JOBS: '/dashboard/jobs',
  INTERVIEWS: '/dashboard/interviews',
  ANALYTICS: '/dashboard/analytics',
  TEAM: '/dashboard/team',
  SETTINGS: '/dashboard/settings',
};

export const USER_ROLES = {
  ADMIN: 'admin',
  RECRUITER: 'recruiter',
  HIRING_MANAGER: 'hiring_manager',
};

export const CANDIDATE_STATUS = {
  NEW: 'new',
  SCREENING: 'screening',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  HIRED: 'hired',
  REJECTED: 'rejected',
};

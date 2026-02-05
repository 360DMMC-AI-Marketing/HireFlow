import axios from 'axios';

const API_URL = 'http://localhost:5000/api/jobs';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // <--- TAKES TOKEN FROM POCKET
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // <--- SHOWS IT TO SERVER
  }
  return config;
});

const getAllJobs = () => api.get('/');
const getJobById = (id) => api.get(`/${id}`);
const createJob = (data) => api.post('/', data);
const updateJob = (id, data) => api.patch(`/${id}`, data);
const deleteJob = (id) => api.delete(`/${id}`);

const JobsService = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob
};

export default JobsService;
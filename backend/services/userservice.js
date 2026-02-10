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

const getUserProfile = () => api.get('/profile');
const updateUserProfile = (data) => api.put('/profile', data);
// Add more user-related API calls as needed
const UserService = {
  getUserProfile,
  updateUserProfile
};  

export default UserService;
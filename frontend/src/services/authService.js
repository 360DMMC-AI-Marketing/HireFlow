const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token from localStorage
const getToken = () => localStorage.getItem('token');

// Helper function to set auth token in localStorage
const setToken = (token) => localStorage.setItem('token', token);

// Helper function to remove auth token from localStorage
const removeToken = () => localStorage.removeItem('token');

// Helper function to make API requests with auth header
const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
    }

    return data;
};

// SIGNUP
export const signup = async (userData) => {
    const data = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
    return data;
};

// VERIFY EMAIL
export const verifyEmail = async (token) => {
    const data = await apiRequest('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
    });
    return data;
};

// LOGIN
export const login = async (email, password) => {
    const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    if (data.token) {
        setToken(data.token);
    }

    return data;
};

// FORGOT PASSWORD
export const forgotPassword = async (email) => {
    const data = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
    return data;
};

// RESET PASSWORD
export const resetPassword = async (token, password) => {
    const data = await apiRequest(`/auth/reset-password/${token}`, {
        method: 'POST',
        body: JSON.stringify({ password }),
    });
    return data;
};

// GET ME (protected)
export const getMe = async () => {
    const data = await apiRequest('/auth/me', {
        method: 'GET',
    });
    return data;
};

// LOGOUT
export const logout = async () => {
    const data = await apiRequest('/auth/logout', {
        method: 'POST',
    });
    removeToken();
    return data;
};

// CHECK IF USER IS LOGGED IN
export const isAuthenticated = () => {
    return !!getToken();
};

// GET TOKEN (for direct use)
export { getToken, setToken, removeToken };

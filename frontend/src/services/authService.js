// client/src/services/authService.js

// 1. Point to your backend API root
// Make sure your backend runs on port 5000 and has /api prefix
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// --- HELPER FUNCTIONS ---

const getToken = () => localStorage.getItem('token');
const getUser = () => JSON.parse(localStorage.getItem('user'));

const setAuthSession = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
};

const clearAuthSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

// Centralized request handler
const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Attach token if it exists (Fixes the 401 errors for protected routes)
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            // Throw error with message from backend (e.g., "Invalid credentials")
            throw new Error(data.error || data.message || 'Something went wrong');
        }

        return data;
    } catch (error) {
        throw error; // Re-throw so components can catch it
    }
};

// --- AUTH ACTIONS (Matching your Backend Controller) ---

// SIGNUP
// Backend expects: { email, password, companyName, industry, companySize }
export const signup = async (userData) => {
    return await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
};

// VERIFY EMAIL
// Backend expects: { token } in body
export const verifyEmail = async (token) => {
    return await apiRequest('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
    });
};

// LOGIN
// Backend expects: { email, password }
// Backend returns: { success: true, token: "...", user: { id, email, ... } }
export const login = async (email, password) => {
    const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    if (data.token) {
        // Save BOTH token and user data
        setAuthSession(data.token, data.user);
    }

    return data;
};

// FORGOT PASSWORD
// Backend expects: { email }
export const forgotPassword = async (email) => {
    return await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
};

// RESET PASSWORD
// Backend expects: token in URL params, password in body
export const resetPassword = async (token, password) => {
    // Note: Usually updates are PUT. If your route is POST, change method to 'POST'
    return await apiRequest(`/auth/resetpassword/${token}`, {
        method: 'PUT', 
        body: JSON.stringify({ password }),
    });
};

// GET ME (Protected Route)
export const getMe = async () => {
    return await apiRequest('/auth/me', {
        method: 'GET',
    });
};

// LOGOUT
export const logout = async () => {
    try {
        // Optional: Notify server
        await apiRequest('/auth/logout', { method: 'GET' });
    } catch (err) {
        console.error("Logout server error (ignoring)", err);
    } finally {
        // Always clear local storage
        clearAuthSession();
    }
};

// --- UTILS ---

export const isAuthenticated = () => {
    return !!getToken();
};

export const getCurrentUser = () => {
    return getUser();
};

// Export helpers if needed directly
export { getToken, getUser };
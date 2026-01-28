import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for better error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized globally
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('trust_user_profile');
            // Optional: redirect to login if we had access to router here
        }

        return Promise.reject(error);
    }
);

export default api;
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/// <reference types="vite/client" />
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Send cookies with requests
});

// Request interceptor for generic config tasks
api.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling 401 Unauthorized and Token Refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and it's not a retry (avoid infinite loop)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh the access token
                // Backend is expected to have an /auth/refresh endpoint (GET)
                await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
                    withCredentials: true
                });

                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, redirect to login could be handled here
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

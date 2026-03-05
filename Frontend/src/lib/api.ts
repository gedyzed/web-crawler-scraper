/// <reference types="vite/client" />
import axios from 'axios';
import Cookies from 'js-cookie';

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

// Endpoints that should never trigger token refresh logic
const AUTH_ENDPOINTS = ['/auth/me', '/auth/login', '/auth/register', '/auth/refresh', '/auth/oauth'];
let isRedirecting = false;

// Response interceptor for handling 401 Unauthorized and Token Refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || '';

        // Skip interceptor for auth endpoints — they handle their own errors
        const isAuthEndpoint = AUTH_ENDPOINTS.some(ep => requestUrl.startsWith(ep));
        if (isAuthEndpoint) {
            return Promise.reject(error);
        }

        // If error is 401 and it's not a retry (avoid infinite loop)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
                    withCredentials: true
                });
                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails and we're not already redirecting, go to login
                if (!isRedirecting) {
                    isRedirecting = true;
                    console.error("Refresh token expired or invalid, logging out");
                    Cookies.remove('accessToken');
                    window.location.href = '/login?error=Session+expired.+Please+log+in+again.';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

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

// Request interceptor for adding the auth token
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
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
                // Backend is expected to have an /auth/refresh endpoint that uses the refreshToken (HttpOnly cookie)
                const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {}, {
                    withCredentials: true
                });

                const { accessToken } = response.data;

                // Update the accessToken cookie
                Cookies.set('accessToken', accessToken, { expires: 1 / 24 }); // 1 hour expiration for the cookie

                // Retry the original request with the new token
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, clear auth state and redirect to login
                Cookies.remove('accessToken');
                // Optional: window.location.href = '/login'; or dispatch logout if possible
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

/**
 * SAHAY API Client
 * 
 * Configured Axios instance with environment variable support.
 * Ready for future Node.js, Express.js, and MongoDB backend integration.
 * In demo mode, gracefully delegates or falls back to local data adapter.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach JWT token if present in future auth
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('sahay_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Clean error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If backend is not running or network fails, log cleanly without breaking demo
    if (IS_DEMO_MODE) {
      console.warn('[SAHAY Demo Mode] Backend request bypassed or unreachable. Using client-side state adapter.', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;

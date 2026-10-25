import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
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

// Response interceptor to handle errors and extract data envelopes
apiClient.interceptors.response.use(
  (response) => {
    // If backend uses the standard envelope format, unpack the nested data field
    if (response.data && response.data.success === true && response.data.data !== undefined) {
      const unwrapped = response.data.data;
      const meta = response.data.meta;
      // Add a self-referencing non-enumerable 'data' property so response.data.data works
      if (unwrapped && typeof unwrapped === 'object' && !Array.isArray(unwrapped)) {
        Object.defineProperty(unwrapped, 'data', {
          get() { return unwrapped; },
          configurable: true,
          enumerable: false
        });
      }
      // Preserve pagination meta (arrays and objects) so response.data.meta works
      if (meta !== undefined && unwrapped && typeof unwrapped === 'object') {
        Object.defineProperty(unwrapped, 'meta', {
          get() { return meta; },
          configurable: true,
          enumerable: false
        });
      }
      response.data = unwrapped;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default apiClient;


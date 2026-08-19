import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Crucial for HTTP-only cookie exchange
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to format error structures
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data || {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
    return Promise.reject(errorData);
  }
);

export default api;

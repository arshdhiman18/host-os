import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hostos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hostos_token');
      window.location.href = '/login';
    }
    if (err.response?.status === 402) {
      // Re-sync user state from server so the frontend gate reflects reality
      window.dispatchEvent(new CustomEvent('hostos:subscription-expired'));
    }
    return Promise.reject(err);
  }
);

export default api;

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const url = error.config?.url || '';
      const status = error.response.status;
      // Suppress expected 404s (e.g. ads route not yet implemented or profile not created yet)
      const isExpected404 = status === 404 && (url.includes('/ads/') || url.includes('/profile/me'));
      if (!isExpected404) {
        console.error(
          `🔴 API ERROR [${status}] ${error.config?.method?.toUpperCase()} ${url}`,
          '\nPayload:', error.config?.data,
          '\nResponse:', error.response.data
        );
      }
    }
    return Promise.reject(error);
  }
);

export default api;

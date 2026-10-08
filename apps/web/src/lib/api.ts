import axios from 'axios';

let baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
if (baseUrl.startsWith('http') && !baseUrl.endsWith('/api')) {
  baseUrl = baseUrl.endsWith('/') ? `${baseUrl}api` : `${baseUrl}/api`;
}

const api = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token && typeof window !== 'undefined') {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        token = parsed?.state?.token;
        if (token) {
          localStorage.setItem('token', token);
        }
      }
    } catch {}
  }

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

      // Handle 401 Unauthorized for expired or invalidated tokens (except during login attempts)
      if (status === 401 && !url.includes('/auth/login')) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('auth-storage');
          if (window.location.pathname.startsWith('/dashboard')) {
            window.location.href = '/login?expired=true';
          }
        }
      }

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

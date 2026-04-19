import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('wecruiting_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    // Don't redirect for /auth/me — authStore handles that gracefully.
    // Only redirect when a protected app request returns 401 (session expired mid-use).
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/me')) {
      localStorage.removeItem('wecruiting_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

import axios from 'axios';

// in dev we lean on the Vite proxy (/api). in prod VITE_API_URL points at the
// deployed backend, e.g. https://interview-api.onrender.com
const host = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';
export const fileBase = host;

const api = axios.create({
  baseURL: `${host}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // bounce to login on an expired/invalid session, but not while already on an
    // auth page (avoids a redirect loop on a bad login attempt)
    if (err.response?.status === 401 && !['/login', '/register'].includes(window.location.pathname)) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

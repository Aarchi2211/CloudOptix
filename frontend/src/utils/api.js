import { getAuthToken } from './auth';

// ── Base URL ──────────────────────────────────────────────────────────────────
// Production : VITE_API_URL = https://your-backend.onrender.com/api  (set in Vercel dashboard)
// Local dev  : falls back to empty string → Vite proxy forwards /api/* → localhost:5000
const BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') // strip trailing slash
  : '/api';

// ── Core request helper ───────────────────────────────────────────────────────
const parseError = async (response) => {
  try {
    const data = await response.clone().json();
    return data.error || data.message || `API error ${response.status}`;
  } catch {
    const text = await response.text().catch(() => '');
    return text || `API error ${response.status}`;
  }
};

const request = async (endpoint, options = {}) => {
  const token = getAuthToken();

  // endpoint should NOT include /api prefix — BASE_URL already has it
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) return null;

  return response.json();
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginUser = (credentials) =>
  request('/login', { method: 'POST', body: JSON.stringify(credentials) });

export const registerUser = (payload) =>
  request('/register', { method: 'POST', body: JSON.stringify(payload) });

// ── Profile ───────────────────────────────────────────────────────────────────
export const getProfile = () => request('/profile');

export const updateProfile = (name) =>
  request('/profile', { method: 'PATCH', body: JSON.stringify({ name }) });

export const updatePassword = (currentPassword, newPassword) =>
  request('/profile/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) });

// ── Usage ─────────────────────────────────────────────────────────────────────
export const uploadUsageRecords = (records) =>
  request('/upload', { method: 'POST', body: JSON.stringify({ records }) });

export const fetchUsageRecords = () => request('/usage');

// ── Alerts ────────────────────────────────────────────────────────────────────
export const fetchAlerts = () => request('/alerts');

export const updateAlertStatus = (id, status) =>
  request(`/alerts/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const deleteAlertById = (id) =>
  request(`/alerts/${id}`, { method: 'DELETE' });

// ── Admin / Users ─────────────────────────────────────────────────────────────
export const fetchAllUsers = () => request('/users');

export const deleteUserById = (id) =>
  request(`/users/${id}`, { method: 'DELETE' });

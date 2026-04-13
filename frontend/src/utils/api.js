import { getAuthToken } from './auth';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const parseErrorMessage = async (response) => {
  const clone = response.clone();

  try {
    const data = await response.json();
    return data.error || data.message || `API error ${response.status}`;
  } catch {
    const errorText = await clone.text();
    return errorText || `API error ${response.status}`;
  }
};

const request = async (path, options = {}) => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const uploadUsageRecords = async (records) => {
  return request('/api/upload', {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
};

export const fetchUsageRecords = async () => {
  return request('/api/usage');
};

export const fetchAlerts = async () => {
  return request('/api/alerts');
};

export const updateAlertStatus = async (id, status) => {
  return request(`/api/alerts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const deleteAlertById = async (id) => {
  return request(`/api/alerts/${id}`, {
    method: 'DELETE',
  });
};

export const loginUser = async (credentials) => {
  return request('/api/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

export const registerUser = async (payload) => {
  return request('/api/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const fetchAllUsers = async () => {
  return request('/api/users');
};

export const deleteUserById = async (id) => {
  return request(`/api/users/${id}`, {
    method: 'DELETE',
  });
};

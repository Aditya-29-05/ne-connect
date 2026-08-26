/**
 * Centralized API Service for NE-Connect
 * Handles base URL configuration, Bearer token injection, request formatting, and structured error handling.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Get stored JWT token from localStorage
 */
export const getToken = () => {
  return localStorage.getItem('ne_connect_token');
};

/**
 * Set JWT token in localStorage
 */
export const setToken = (token) => {
  if (token) {
    localStorage.setItem('ne_connect_token', token);
  } else {
    localStorage.removeItem('ne_connect_token');
  }
};

/**
 * Remove JWT token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem('ne_connect_token');
};

/**
 * Generic API request handler
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({
      success: false,
      message: 'Failed to parse JSON response from server'
    }));

    if (!response.ok) {
      // Handle 401 unauthorized (token expired or invalid)
      if (response.status === 401 && endpoint !== '/api/auth/login' && endpoint !== '/api/auth/register') {
        removeToken();
        // Optional dispatch event or notify listeners
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }

      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      error.errors = data.errors;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const netError = new Error('Cannot connect to NE-Connect backend server. Please verify the service is online.');
      netError.status = 503;
      throw netError;
    }
    throw error;
  }
}

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),

  // Auth specific endpoints
  auth: {
    register: (userData) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    login: (credentials) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    getMe: () => request('/api/auth/me', { method: 'GET' })
  },

  // Health check
  health: () => request('/api/health', { method: 'GET' })
};

export default api;

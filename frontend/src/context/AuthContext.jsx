import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken, removeToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setAuthToken] = useState(getToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore user session on mount or token change
  const loadUser = useCallback(async () => {
    const storedToken = getToken();
    if (!storedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.auth.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        throw new Error('Failed to retrieve user profile');
      }
    } catch (err) {
      console.warn('Session restoration failed:', err.message);
      removeToken();
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    // Listen for unauthorized events dispatched from api.js
    const handleUnauthorized = () => {
      removeToken();
      setAuthToken(null);
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [loadUser]);

  // Login handler
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.auth.login({ email, password });
      if (res.success && res.data) {
        const { user: userData, token: jwtToken } = res.data;
        setToken(jwtToken);
        setAuthToken(jwtToken);
        setUser(userData);
        return { success: true, user: userData };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Registration handler
  const register = async (name, email, password) => {
    setError(null);
    try {
      const res = await api.auth.register({ name, email, password });
      if (res.success && res.data) {
        const { user: userData, token: jwtToken } = res.data;
        setToken(jwtToken);
        setAuthToken(jwtToken);
        setUser(userData);
        return { success: true, user: userData };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Logout handler
  const logout = () => {
    removeToken();
    setAuthToken(null);
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser: loadUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

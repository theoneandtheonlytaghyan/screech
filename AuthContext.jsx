/**
 * Auth Context
 * Manages authentication state across the app
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, usersAPI } from '../services/api';
import { STORAGE_KEYS } from '../utils/constants';
import { getErrorMessage } from '../utils/helpers';

// Create context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(STORAGE_KEYS.TOKEN));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  /**
   * Load user from token on mount
   */
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.getMe();
        setUser(response.data.data.user);
      } catch (err) {
        console.error('Failed to load user:', err);
        // Clear invalid token
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  /**
   * Register new user
   */
  const register = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);

    try {
      const response = await authAPI.register({ email, password });
      const { user: userData, token: authToken } = response.data.data;

      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

      // Update state
      setToken(authToken);
      setUser(userData);

      navigate('/');
      return { success: true };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  /**
   * Login user
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      const { user: userData, token: authToken } = response.data.data;

      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

      // Update state
      setToken(authToken);
      setUser(userData);

      navigate('/');
      return { success: true };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);

      // Clear state
      setToken(null);
      setUser(null);

      navigate('/login');
    }
  }, [navigate]);

  /**
   * Regenerate identity
   */
  const regenerateIdentity = useCallback(async (keepClan = false) => {
    setError(null);

    try {
      const response = await usersAPI.regenerateIdentity({ keepClan });
      const updatedUser = response.data.data.user;

      // Update localStorage
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

      // Update state
      setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Change password
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    setError(null);

    try {
      const response = await authAPI.changePassword({ currentPassword, newPassword });
      const { token: newToken } = response.data.data;

      // Update token
      localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
      setToken(newToken);

      return { success: true };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Delete account
   */
  const deleteAccount = useCallback(async (password) => {
    setError(null);

    try {
      await authAPI.deleteAccount({ password });

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);

      // Clear state
      setToken(null);
      setUser(null);

      navigate('/login');
      return { success: true };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    }
  }, [navigate]);

  /**
   * Update user data locally
   */
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    regenerateIdentity,
    changePassword,
    deleteAccount,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;
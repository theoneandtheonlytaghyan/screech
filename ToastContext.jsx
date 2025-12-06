/**
 * Toast Context
 * Manages toast notifications across the app
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { generateId } from '../utils/helpers';
import { TOAST_DURATION } from '../utils/constants';

// Create context
const ToastContext = createContext(null);

/**
 * Toast Provider Component
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Add a new toast
   */
  const addToast = useCallback((message, type = 'info', duration = TOAST_DURATION) => {
    const id = generateId();

    const toast = {
      id,
      message,
      type,
      duration
    };

    setToasts((prev) => [...prev, toast]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  /**
   * Remove a toast by id
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Clear all toasts
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * Success toast
   */
  const success = useCallback((message, duration) => {
    return addToast(message, 'success', duration);
  }, [addToast]);

  /**
   * Error toast
   */
  const error = useCallback((message, duration) => {
    return addToast(message, 'error', duration);
  }, [addToast]);

  /**
   * Info toast
   */
  const info = useCallback((message, duration) => {
    return addToast(message, 'info', duration);
  }, [addToast]);

  /**
   * Warning toast
   */
  const warning = useCallback((message, duration) => {
    return addToast(message, 'warning', duration);
  }, [addToast]);

  // Context value
  const value = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    info,
    warning
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * Toast Container Component
 */
const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

/**
 * Individual Toast Component
 */
const Toast = ({ toast, onClose }) => {
  const { message, type } = toast;

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  const styles = {
    success: 'toast-success',
    error: 'toast-error',
    info: 'toast-info',
    warning: 'toast-warning'
  };

  return (
    <div className={`toast ${styles[type]} flex items-center justify-between min-w-[280px]`}>
      <div className="flex items-center gap-3">
        <span className="text-lg">{icons[type]}</span>
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-white/70 hover:text-white transition-colors"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
};

/**
 * useToast Hook
 */
export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
};

export default ToastContext;
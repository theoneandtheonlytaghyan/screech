/**
 * Toast Component
 * Notification toast messages
 */

import { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({
  id,
  message,
  type = 'info',
  duration = 3000,
  onClose
}) => {
  const [isExiting, setIsExiting] = useState(false);

  // Auto close
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.(id);
    }, 200);
  };

  // Icons by type
  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />
  };

  // Styles by type
  const styles = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600'
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-screech-xl
        text-white min-w-[280px] max-w-md
        ${styles[type]}
        ${isExiting ? 'animate-fade-out' : 'animate-slide-down'}
      `}
      role="alert"
    >
      {/* Icon */}
      <span className="flex-shrink-0">
        {icons[type]}
      </span>

      {/* Message */}
      <p className="flex-1 text-sm font-medium">
        {message}
      </p>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
};

/**
 * Toast Container Component
 */
export const ToastContainer = ({
  toasts = [],
  position = 'top-right',
  onClose
}) => {
  // Position styles
  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className={`fixed ${positions[position]} z-[100] flex flex-col gap-2`}
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

/**
 * Simple Toast Function Component
 * Use with ToastContext for full functionality
 */
export const SimpleToast = ({
  message,
  type = 'info',
  onClose
}) => {
  const emojis = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const styles = {
    success: 'toast-success',
    error: 'toast-error',
    warning: 'toast-warning',
    info: 'toast-info'
  };

  return (
    <div className={`toast ${styles[type]}`}>
      <span className="text-lg">{emojis[type]}</span>
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={onClose}
        className="text-white/70 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;
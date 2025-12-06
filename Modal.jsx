/**
 * Modal Component
 * Reusable modal dialog
 */

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = ''
}) => {
  // Handle escape key
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose?.();
    }
  }, [closeOnEscape, onClose]);

  // Add escape listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose?.();
    }
  };

  if (!isOpen) return null;

  // Size styles
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full mx-4'
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`
          modal-content
          ${sizes[size]}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-5 border-b border-screech-border">
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-screech-text"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-screech-textMuted hover:text-screech-text hover:bg-screech-border transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-screech-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Confirm Modal Component
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
  danger = false
}) => {
  const handleConfirm = async () => {
    await onConfirm?.();
    if (!loading) {
      onClose?.();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={danger ? 'danger' : confirmVariant}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-screech-textMuted">
        {message}
      </p>
    </Modal>
  );
};

/**
 * Alert Modal Component
 */
export const AlertModal = ({
  isOpen,
  onClose,
  title = 'Alert',
  message,
  buttonText = 'OK',
  type = 'info'
}) => {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <Button onClick={onClose}>
          {buttonText}
        </Button>
      }
    >
      <div className="text-center">
        <span className="text-4xl mb-4 block">{icons[type]}</span>
        <h3 className="text-lg font-semibold text-screech-text mb-2">
          {title}
        </h3>
        <p className="text-screech-textMuted">
          {message}
        </p>
      </div>
    </Modal>
  );
};

export default Modal;
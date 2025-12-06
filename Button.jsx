/**
 * Button Component
 * Reusable button with multiple variants
 */

import { forwardRef } from 'react';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  onClick,
  ...props
}, ref) => {
  // Variant styles
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    outline: 'border border-screech-border text-screech-text hover:bg-screech-border'
  };

  // Size styles
  const sizes = {
    sm: 'btn-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'btn-lg',
    icon: 'btn-icon'
  };

  // Combined classes
  const classes = [
    'btn',
    variants[variant],
    sizes[size],
    fullWidth ? 'w-full' : '',
    disabled || loading ? 'opacity-50 cursor-not-allowed' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size={size === 'sm' ? 'sm' : 'md'} />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
          )}
          {children}
          {Icon && iconPosition === 'right' && (
            <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
          )}
        </>
      )}
    </button>
  );
});

/**
 * Loading Spinner Component
 */
const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * Icon Button Component
 */
export const IconButton = forwardRef(({
  icon: Icon,
  size = 'md',
  variant = 'ghost',
  className = '',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22
  };

  return (
    <Button
      ref={ref}
      variant={variant}
      size="icon"
      className={`${sizeClasses[size]} ${className}`}
      {...props}
    >
      <Icon size={iconSizes[size]} />
    </Button>
  );
});

Button.displayName = 'Button';
IconButton.displayName = 'IconButton';

export default Button;
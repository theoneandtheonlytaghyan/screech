/**
 * Card Component
 * Reusable card container with variants
 */

import { forwardRef } from 'react';

const Card = forwardRef(({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  onClick,
  className = '',
  ...props
}, ref) => {
  // Variant styles
  const variants = {
    default: 'card',
    outline: 'border border-screech-border rounded-2xl bg-transparent',
    ghost: 'bg-transparent',
    elevated: 'card shadow-screech-lg'
  };

  // Padding styles
  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8'
  };

  // Combined classes
  const classes = [
    variants[variant],
    paddings[padding],
    hover ? 'card-hover cursor-pointer' : '',
    onClick ? 'cursor-pointer' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      className={classes}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * Card Header Component
 */
export const CardHeader = ({
  children,
  title,
  subtitle,
  action,
  className = ''
}) => {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div>
        {title && (
          <h3 className="text-lg font-semibold text-screech-text">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-screech-textMuted mt-0.5">
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};

/**
 * Card Body Component
 */
export const CardBody = ({
  children,
  className = ''
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

/**
 * Card Footer Component
 */
export const CardFooter = ({
  children,
  border = true,
  className = ''
}) => {
  return (
    <div
      className={`
        mt-4 pt-4
        ${border ? 'border-t border-screech-border' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

/**
 * Card Divider Component
 */
export const CardDivider = ({ className = '' }) => {
  return (
    <hr className={`border-screech-border my-4 ${className}`} />
  );
};

/**
 * Clickable Card Component
 */
export const ClickableCard = forwardRef(({
  children,
  onClick,
  href,
  className = '',
  ...props
}, ref) => {
  const classes = `
    card card-hover
    transition-all duration-200
    ${className}
  `;

  if (href) {
    return (
      <a
        ref={ref}
        href={href}
        className={classes}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <div
      ref={ref}
      className={classes}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.(e);
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';
ClickableCard.displayName = 'ClickableCard';

export default Card;
/**
 * Input Component
 * Reusable input with label and error handling
 */

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  hint,
  disabled = false,
  required = false,
  icon: Icon,
  className = '',
  inputClassName = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-semibold text-screech-accent mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Left icon */}
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-screech-textMuted">
            <Icon size={18} />
          </div>
        )}

        {/* Input field */}
        <input
          ref={ref}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            input
            ${Icon ? 'pl-10' : ''}
            ${isPassword ? 'pr-10' : ''}
            ${error ? 'input-error' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${inputClassName}
          `}
          {...props}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-screech-textMuted hover:text-screech-text transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}

      {/* Hint text */}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-screech-textMuted">
          {hint}
        </p>
      )}
    </div>
  );
});

/**
 * Textarea Component
 */
export const Textarea = forwardRef(({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  hint,
  disabled = false,
  required = false,
  rows = 3,
  maxLength,
  showCount = false,
  className = '',
  textareaClassName = '',
  ...props
}, ref) => {
  const charCount = value?.length || 0;
  const remaining = maxLength ? maxLength - charCount : null;

  const getCounterColor = () => {
    if (!remaining) return 'text-screech-textMuted';
    if (remaining <= 10) return 'text-red-500';
    if (remaining <= 30) return 'text-yellow-500';
    return 'text-screech-textMuted';
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-semibold text-screech-accent mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Textarea */}
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        className={`
          input resize-none
          ${error ? 'input-error' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${textareaClassName}
        `}
        {...props}
      />

      {/* Footer */}
      <div className="flex justify-between items-center mt-1.5">
        {/* Error or hint */}
        <div>
          {error && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <span>⚠️</span>
              {error}
            </p>
          )}
          {hint && !error && (
            <p className="text-xs text-screech-textMuted">
              {hint}
            </p>
          )}
        </div>

        {/* Character count */}
        {showCount && maxLength && (
          <span className={`text-sm font-medium ${getCounterColor()}`}>
            {remaining}
          </span>
        )}
      </div>
    </div>
  );
});

Input.displayName = 'Input';
Textarea.displayName = 'Textarea';

export default Input;
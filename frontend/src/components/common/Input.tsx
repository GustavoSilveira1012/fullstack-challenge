import React, { InputHTMLAttributes, useCallback } from 'react';
import { sanitizeFormInput } from '../../utils/security';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  sanitize?: boolean; // Enable/disable input sanitization
}

/**
 * Input component with validation support and XSS protection
 * Displays error messages and helper text
 * Fully accessible with associated labels
 * Requirement 3.2.2: Input sanitization to prevent XSS attacks
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      type = 'text',
      disabled = false,
      required = false,
      sanitize = true,
      className = '',
      id,
      onChange,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    /**
     * Handle input change with sanitization
     */
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (sanitize && type === 'text') {
        // Sanitize text input to prevent XSS
        const sanitizedValue = sanitizeFormInput(e.target.value);
        e.target.value = sanitizedValue;
      }
      
      // Call original onChange handler
      onChange?.(e);
    }, [onChange, sanitize, type]);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          required={required}
          onChange={handleChange}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`
            w-full px-3 py-2 border rounded-lg
            text-gray-900 dark:text-white
            bg-white dark:bg-gray-800
            border-gray-300 dark:border-gray-600
            placeholder-gray-400 dark:placeholder-gray-500
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 dark:disabled:bg-gray-700
            disabled:text-gray-500 dark:disabled:text-gray-400
            disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1 text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

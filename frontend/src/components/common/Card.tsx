import React, { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

/**
 * Card component - a container with padding, border radius, and shadow
 * Used as a base component for grouping related content
 * Supports click handlers for interactive cards
 * Fully accessible with proper ARIA attributes
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', onClick, 'aria-label': ariaLabel, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const isInteractive = !!onClick;
    
    return (
      <div
        ref={ref}
        onClick={onClick}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        onKeyDown={isInteractive ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        } : undefined}
        className={`
          bg-white dark:bg-gray-800
          rounded-lg shadow-md
          p-4 md:p-6
          transition-all duration-200
          ${isInteractive ? 'cursor-pointer hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

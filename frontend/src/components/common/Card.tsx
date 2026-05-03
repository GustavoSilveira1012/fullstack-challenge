import React, { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Card component - a container with padding, border radius, and shadow
 * Used as a base component for grouping related content
 * Supports click handlers for interactive cards
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', onClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`
          bg-white dark:bg-gray-800
          rounded-lg shadow-md
          p-4 md:p-6
          transition-all duration-200
          ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}
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

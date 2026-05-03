import React from 'react';

export type LoadingSize = 'small' | 'medium' | 'large';

interface LoadingProps {
  size?: LoadingSize;
  text?: string;
  overlay?: boolean;
  className?: string;
}

const sizeStyles: Record<LoadingSize, string> = {
  small: 'w-6 h-6',
  medium: 'w-10 h-10',
  large: 'w-16 h-16',
};

/**
 * Loading component with spinner animation
 * Supports different sizes and optional overlay mode
 * Fully accessible with ARIA labels
 */
export const Loading: React.FC<LoadingProps> = ({
  size = 'medium',
  text,
  overlay = false,
  className = '',
}) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <svg
        className={`animate-spin text-blue-600 dark:text-blue-400 ${sizeStyles[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-busy="true"
        aria-label="Loading"
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
      {text && (
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div
        className={`
          fixed inset-0 bg-black bg-opacity-50
          flex items-center justify-center
          z-50
          ${className}
        `}
        role="status"
        aria-label="Loading"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          {spinner}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      {spinner}
    </div>
  );
};

Loading.displayName = 'Loading';

import React from 'react';

export type LoadingSize = 'small' | 'medium' | 'large';
export type LoadingVariant = 'spinner' | 'dots' | 'pulse' | 'skeleton';

interface LoadingProps {
  size?: LoadingSize;
  variant?: LoadingVariant;
  text?: string;
  overlay?: boolean;
  className?: string;
  fullScreen?: boolean;
}

const sizeStyles: Record<LoadingSize, string> = {
  small: 'w-6 h-6',
  medium: 'w-10 h-10',
  large: 'w-16 h-16',
};

/**
 * Loading component with multiple variants and animations
 * Requirement 2.8.1: Display loading states for all async operations
 * Supports different sizes, variants, and overlay modes
 * Fully accessible with ARIA labels
 */
export const Loading: React.FC<LoadingProps> = ({
  size = 'medium',
  variant = 'spinner',
  text,
  overlay = false,
  fullScreen = false,
  className = '',
}) => {
  const renderSpinner = () => (
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
  );

  const renderDots = () => {
    const dotSize = size === 'small' ? 'w-2 h-2' : size === 'medium' ? 'w-3 h-3' : 'w-4 h-4';
    return (
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${dotSize} bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse`}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s',
            }}
          />
        ))}
      </div>
    );
  };

  const renderPulse = () => {
    const pulseSize = size === 'small' ? 'w-8 h-8' : size === 'medium' ? 'w-12 h-12' : 'w-16 h-16';
    return (
      <div className={`${pulseSize} bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse`} />
    );
  };

  const renderSkeleton = () => {
    const skeletonHeight = size === 'small' ? 'h-4' : size === 'medium' ? 'h-6' : 'h-8';
    return (
      <div className="space-y-2 w-full max-w-sm">
        <div className={`bg-gray-300 dark:bg-gray-600 rounded ${skeletonHeight} animate-pulse`} />
        <div className={`bg-gray-300 dark:bg-gray-600 rounded ${skeletonHeight} w-3/4 animate-pulse`} />
        <div className={`bg-gray-300 dark:bg-gray-600 rounded ${skeletonHeight} w-1/2 animate-pulse`} />
      </div>
    );
  };

  const renderLoadingContent = () => {
    let loadingElement;
    
    switch (variant) {
      case 'dots':
        loadingElement = renderDots();
        break;
      case 'pulse':
        loadingElement = renderPulse();
        break;
      case 'skeleton':
        loadingElement = renderSkeleton();
        break;
      default:
        loadingElement = renderSpinner();
    }

    return (
      <div className="flex flex-col items-center justify-center gap-3">
        {loadingElement}
        {text && variant !== 'skeleton' && (
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            {text}
          </p>
        )}
      </div>
    );
  };

  if (fullScreen) {
    return (
      <div
        className={`
          fixed inset-0 bg-theme-primary
          flex items-center justify-center
          z-50
          ${className}
        `}
        role="status"
        aria-label="Loading"
      >
        {renderLoadingContent()}
      </div>
    );
  }

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
          {renderLoadingContent()}
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
      {renderLoadingContent()}
    </div>
  );
};

/**
 * LoadingButton Component: Button with integrated loading state
 */
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  children,
  disabled,
  className = '',
  variant = 'primary',
  size = 'medium',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };

  const sizeStyles = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading && (
        <Loading 
          size="small" 
          variant="spinner"
          className="text-current"
        />
      )}
      {loading ? (loadingText || 'Loading...') : children}
    </button>
  );
};

Loading.displayName = 'Loading';
LoadingButton.displayName = 'LoadingButton';

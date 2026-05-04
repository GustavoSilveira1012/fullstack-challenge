import React from 'react';
import { Loading, type LoadingSize, type LoadingVariant } from './Loading';

interface LoadingOverlayProps {
  /**
   * Whether the overlay is visible
   */
  visible: boolean;
  /**
   * Loading text to display
   */
  text?: string;
  /**
   * Loading variant
   */
  variant?: LoadingVariant;
  /**
   * Loading size
   */
  size?: LoadingSize;
  /**
   * Whether to blur the background
   */
  blur?: boolean;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Z-index level
   */
  zIndex?: number;
}

/**
 * LoadingOverlay Component: Full-screen loading overlay
 * Requirement 2.8.1: Display loading states for all async operations
 * Provides a full-screen loading overlay with customizable appearance
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  text = 'Loading...',
  variant = 'spinner',
  size = 'large',
  blur = true,
  className = '',
  zIndex = 50,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div
      className={`
        fixed inset-0 flex items-center justify-center
        bg-black/50 backdrop-blur-sm
        transition-opacity duration-300
        ${blur ? 'backdrop-blur-sm' : ''}
        ${className}
      `}
      style={{ zIndex }}
      role="status"
      aria-label="Loading"
      aria-live="polite"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl max-w-sm w-full mx-4">
        <Loading
          variant={variant}
          size={size}
          text={text}
          className="text-center"
        />
      </div>
    </div>
  );
};

/**
 * PageLoadingOverlay Component: Specialized overlay for page loading
 */
interface PageLoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const PageLoadingOverlay: React.FC<PageLoadingOverlayProps> = ({
  visible,
  message = 'Loading page...',
}) => {
  return (
    <LoadingOverlay
      visible={visible}
      text={message}
      variant="spinner"
      size="large"
      zIndex={100}
    />
  );
};

/**
 * ComponentLoadingOverlay Component: Overlay for specific components
 */
interface ComponentLoadingOverlayProps {
  visible: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}

export const ComponentLoadingOverlay: React.FC<ComponentLoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  children,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {visible && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg"
          role="status"
          aria-label="Loading"
        >
          <Loading
            variant="spinner"
            size="medium"
            text={message}
          />
        </div>
      )}
    </div>
  );
};

/**
 * InlineLoading Component: Simple inline loading indicator
 */
interface InlineLoadingProps {
  visible: boolean;
  text?: string;
  size?: LoadingSize;
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  visible,
  text = 'Loading...',
  size = 'small',
  className = '',
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loading variant="spinner" size={size} />
      {text && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {text}
        </span>
      )}
    </div>
  );
};
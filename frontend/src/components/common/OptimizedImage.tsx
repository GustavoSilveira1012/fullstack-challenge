import React, { useState, useCallback, useMemo } from 'react';

/**
 * OptimizedImage Component
 * Provides WebP support with fallback, lazy loading, and performance optimization
 * Requirement 3.1.1: Performance optimization for faster page loads
 */
interface OptimizedImageProps {
  /**
   * Image source path (without extension)
   */
  src: string;
  /**
   * Alternative text for accessibility
   */
  alt: string;
  /**
   * Optional width
   */
  width?: number;
  /**
   * Optional height
   */
  height?: number;
  /**
   * CSS classes
   */
  className?: string;
  /**
   * Loading strategy
   */
  loading?: 'lazy' | 'eager';
  /**
   * Sizes attribute for responsive images
   */
  sizes?: string;
  /**
   * Callback when image loads
   */
  onLoad?: () => void;
  /**
   * Callback when image fails to load
   */
  onError?: () => void;
  /**
   * Placeholder while loading
   */
  placeholder?: React.ReactNode;
  /**
   * Whether to show loading state
   */
  showLoading?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  sizes,
  onLoad,
  onError,
  placeholder,
  showLoading = true,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageFormat, setImageFormat] = useState<'webp' | 'original'>('webp');

  /**
   * Generate source URLs for different formats
   */
  const sources = useMemo(() => {
    const basePath = src.startsWith('/') ? src : `/${src}`;
    const pathWithoutExt = basePath.replace(/\.[^/.]+$/, '');
    
    return {
      webp: `${pathWithoutExt}.webp`,
      original: src.startsWith('/') ? src : `/${src}`,
    };
  }, [src]);

  /**
   * Handle successful image load
   */
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  /**
   * Handle image load error - fallback to original format
   */
  const handleError = useCallback(() => {
    if (imageFormat === 'webp') {
      // Try original format
      setImageFormat('original');
      setHasError(false);
    } else {
      // Both formats failed
      setIsLoading(false);
      setHasError(true);
      onError?.();
    }
  }, [imageFormat, onError]);

  /**
   * Get current image source
   */
  const currentSrc = useMemo(() => {
    return imageFormat === 'webp' ? sources.webp : sources.original;
  }, [imageFormat, sources]);

  /**
   * Generate responsive srcSet if sizes are provided
   */
  const srcSet = useMemo(() => {
    if (!sizes) return undefined;
    
    const basePath = currentSrc.replace(/\.[^/.]+$/, '');
    const ext = imageFormat === 'webp' ? '.webp' : src.split('.').pop();
    
    // Generate common responsive sizes
    const responsiveSizes = [320, 640, 768, 1024, 1280, 1536];
    
    return responsiveSizes
      .map(size => `${basePath}-${size}w.${ext} ${size}w`)
      .join(', ');
  }, [currentSrc, imageFormat, src, sizes]);

  /**
   * Loading placeholder
   */
  const LoadingPlaceholder = useMemo(() => {
    if (placeholder) return placeholder;
    
    return (
      <div 
        className={`bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center ${className}`}
        style={{ width, height }}
        role="img"
        aria-label="Loading image"
      >
        <svg 
          className="w-8 h-8 text-gray-400 dark:text-gray-500" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path 
            fillRule="evenodd" 
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    );
  }, [placeholder, className, width, height]);

  /**
   * Error placeholder
   */
  const ErrorPlaceholder = useMemo(() => (
    <div 
      className={`bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center ${className}`}
      style={{ width, height }}
      role="img"
      aria-label="Failed to load image"
    >
      <div className="text-center text-gray-500 dark:text-gray-400">
        <svg 
          className="w-8 h-8 mx-auto mb-2" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
            clipRule="evenodd" 
          />
        </svg>
        <span className="text-sm">Image not available</span>
      </div>
    </div>
  ), [className, width, height]);

  // Show loading placeholder
  if (isLoading && showLoading) {
    return LoadingPlaceholder;
  }

  // Show error placeholder
  if (hasError) {
    return ErrorPlaceholder;
  }

  return (
    <picture>
      {/* WebP source for modern browsers */}
      <source 
        srcSet={imageFormat === 'webp' ? (srcSet || sources.webp) : undefined}
        sizes={sizes}
        type="image/webp" 
      />
      
      {/* Fallback image */}
      <img
        src={currentSrc}
        srcSet={imageFormat === 'original' ? srcSet : undefined}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        decoding="async"
        style={{
          display: isLoading && showLoading ? 'none' : 'block',
        }}
      />
    </picture>
  );
};

export default OptimizedImage;
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition Component
 * Provides smooth transitions between route changes
 * Requirement 2.8.4: Smooth animations and transitions throughout the UI
 * 
 * Features:
 * - Fade in/out transitions between pages
 * - Loading state during route changes
 * - Configurable transition duration
 * - Accessibility-friendly (respects prefers-reduced-motion)
 */

interface PageTransitionProps {
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  duration = 300,
  className = ''
}) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Skip animation for users who prefer reduced motion
      setDisplayChildren(children);
      return;
    }

    // Start fade out
    setIsVisible(false);

    const timer = setTimeout(() => {
      // Update children and fade in
      setDisplayChildren(children);
      setIsVisible(true);
    }, duration / 2);

    return () => clearTimeout(timer);
  }, [location.pathname, children, duration]);

  return (
    <div
      className={`transition-opacity duration-${duration} ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{
        transitionDuration: `${duration}ms`
      }}
    >
      {displayChildren}
    </div>
  );
};

/**
 * SlideTransition Component
 * Provides slide transitions between routes
 */
interface SlideTransitionProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  className?: string;
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  children,
  direction = 'right',
  duration = 300,
  className = ''
}) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [displayChildren, setDisplayChildren] = useState(children);

  const getTransformClass = (visible: boolean) => {
    const transforms = {
      left: visible ? 'translate-x-0' : '-translate-x-full',
      right: visible ? 'translate-x-0' : 'translate-x-full',
      up: visible ? 'translate-y-0' : '-translate-y-full',
      down: visible ? 'translate-y-0' : 'translate-y-full'
    };
    return transforms[direction];
  };

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Skip animation for users who prefer reduced motion
      setDisplayChildren(children);
      return;
    }

    // Start slide out
    setIsVisible(false);

    const timer = setTimeout(() => {
      // Update children and slide in
      setDisplayChildren(children);
      setIsVisible(true);
    }, duration / 2);

    return () => clearTimeout(timer);
  }, [location.pathname, children, duration]);

  return (
    <div className="overflow-hidden">
      <div
        className={`transform transition-transform duration-${duration} ${getTransformClass(isVisible)} ${className}`}
        style={{
          transitionDuration: `${duration}ms`
        }}
      >
        {displayChildren}
      </div>
    </div>
  );
};

/**
 * ScaleTransition Component
 * Provides scale transitions between routes
 */
interface ScaleTransitionProps {
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

export const ScaleTransition: React.FC<ScaleTransitionProps> = ({
  children,
  duration = 300,
  className = ''
}) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Skip animation for users who prefer reduced motion
      setDisplayChildren(children);
      return;
    }

    // Start scale out
    setIsVisible(false);

    const timer = setTimeout(() => {
      // Update children and scale in
      setDisplayChildren(children);
      setIsVisible(true);
    }, duration / 2);

    return () => clearTimeout(timer);
  }, [location.pathname, children, duration]);

  return (
    <div
      className={`transform transition-all duration-${duration} ${
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      } ${className}`}
      style={{
        transitionDuration: `${duration}ms`
      }}
    >
      {displayChildren}
    </div>
  );
};
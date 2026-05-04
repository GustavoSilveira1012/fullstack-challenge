import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for managing focus in accessible components
 * Provides utilities for focus trapping, restoration, and keyboard navigation
 */
export const useFocusManagement = () => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /**
   * Store the currently focused element
   */
  const storeFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  /**
   * Restore focus to the previously focused element
   */
  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus();
    }
  }, []);

  /**
   * Focus the first focusable element within a container
   */
  const focusFirst = useCallback((container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, []);

  /**
   * Focus the last focusable element within a container
   */
  const focusLast = useCallback((container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, []);

  return {
    storeFocus,
    restoreFocus,
    focusFirst,
    focusLast,
  };
};

/**
 * Hook for creating a focus trap within a container
 * Useful for modals, dropdowns, and other overlay components
 */
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null);
  const { storeFocus, restoreFocus } = useFocusManagement();

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the current focus
    storeFocus();

    // Focus the first element in the container
    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusableElements = getFocusableElements(containerRef.current);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (isActive) {
        restoreFocus();
      }
    };
  }, [isActive, storeFocus, restoreFocus]);

  return containerRef;
};

/**
 * Hook for handling escape key to close components
 */
export const useEscapeKey = (callback: () => void, isActive: boolean = true) => {
  useEffect(() => {
    if (!isActive) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [callback, isActive]);
};

/**
 * Hook for managing roving tabindex in a list of items
 * Useful for keyboard navigation in lists, menus, and toolbars
 */
export const useRovingTabIndex = (itemCount: number) => {
  const activeIndexRef = useRef(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const setActiveIndex = useCallback((index: number) => {
    if (index >= 0 && index < itemCount) {
      activeIndexRef.current = index;
      itemRefs.current[index]?.focus();
    }
  }, [itemCount]);

  const handleKeyDown = useCallback((event: KeyboardEvent, currentIndex: number) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        setActiveIndex((currentIndex + 1) % itemCount);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        setActiveIndex(currentIndex === 0 ? itemCount - 1 : currentIndex - 1);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(itemCount - 1);
        break;
    }
  }, [itemCount, setActiveIndex]);

  const getItemProps = useCallback((index: number) => ({
    ref: (el: HTMLElement | null) => {
      itemRefs.current[index] = el;
    },
    tabIndex: index === activeIndexRef.current ? 0 : -1,
    onKeyDown: (event: KeyboardEvent) => handleKeyDown(event, index),
    onFocus: () => {
      activeIndexRef.current = index;
    },
  }), [handleKeyDown]);

  return {
    activeIndex: activeIndexRef.current,
    setActiveIndex,
    getItemProps,
  };
};

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
}

/**
 * Hook for announcing content to screen readers
 */
export const useScreenReaderAnnouncement = () => {
  const announcementRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcementRef.current) {
      // Create announcement element if it doesn't exist
      const element = document.createElement('div');
      element.setAttribute('aria-live', priority);
      element.setAttribute('aria-atomic', 'true');
      element.className = 'sr-only';
      document.body.appendChild(element);
      if (element) {
        (announcementRef as React.MutableRefObject<HTMLElement | null>).current = element;
      }
    }

    // Update the aria-live attribute if priority changed
    if (announcementRef.current) {
      announcementRef.current.setAttribute('aria-live', priority);
    }
    
    // Clear and then set the message to ensure it's announced
    if (announcementRef.current) {
      announcementRef.current.textContent = '';
    }
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = message;
      }
    }, 100);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (announcementRef.current && announcementRef.current.parentNode) {
        announcementRef.current.parentNode.removeChild(announcementRef.current);
      }
    };
  }, []);

  return { announce };
};
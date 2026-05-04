/**
 * Accessibility utility functions
 * Provides helpers for WCAG compliance and screen reader support
 */

/**
 * Generate a unique ID for accessibility attributes
 */
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if an element is visible to screen readers
 */
export const isVisibleToScreenReader = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  return !(
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0' ||
    element.hasAttribute('aria-hidden') ||
    element.getAttribute('aria-hidden') === 'true'
  );
};

/**
 * Get the accessible name of an element
 */
export const getAccessibleName = (element: HTMLElement): string => {
  // Check aria-label first
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // Check aria-labelledby
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement) return labelElement.textContent || '';
  }

  // Check associated label for form elements
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
    const id = element.getAttribute('id');
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent || '';
    }
  }

  // Fall back to text content
  return element.textContent || '';
};

/**
 * Check if color contrast meets WCAG AA standards (4.5:1)
 */
export const checkColorContrast = (foreground: string, background: string): boolean => {
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);
  
  const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                   (Math.min(fgLuminance, bgLuminance) + 0.05);
  
  return contrast >= 4.5;
};

/**
 * Calculate relative luminance of a color
 */
function getRelativeLuminance(color: string): number {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // Apply gamma correction
  const sRGB = [r, g, b].map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  // Calculate luminance
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Create ARIA attributes for live regions
 */
export const createLiveRegionProps = (
  priority: 'polite' | 'assertive' = 'polite',
  atomic: boolean = true
) => ({
  'aria-live': priority,
  'aria-atomic': atomic,
});

/**
 * Create ARIA attributes for expanded/collapsed states
 */
export const createExpandedProps = (isExpanded: boolean, controlsId?: string) => ({
  'aria-expanded': isExpanded,
  ...(controlsId && { 'aria-controls': controlsId }),
});

/**
 * Create ARIA attributes for form validation
 */
export const createValidationProps = (
  isInvalid: boolean,
  errorId?: string,
  describedById?: string
) => ({
  'aria-invalid': isInvalid,
  ...(errorId && isInvalid && { 'aria-describedby': errorId }),
  ...(describedById && !isInvalid && { 'aria-describedby': describedById }),
});

/**
 * Create ARIA attributes for loading states
 */
export const createLoadingProps = (isLoading: boolean, label?: string) => ({
  'aria-busy': isLoading,
  ...(label && { 'aria-label': label }),
});

/**
 * Create ARIA attributes for modal dialogs
 */
export const createModalProps = (titleId: string, descriptionId?: string) => ({
  role: 'dialog',
  'aria-modal': true,
  'aria-labelledby': titleId,
  ...(descriptionId && { 'aria-describedby': descriptionId }),
});

/**
 * Create ARIA attributes for menu components
 */
export const createMenuProps = (orientation: 'horizontal' | 'vertical' = 'vertical') => ({
  role: 'menu',
  'aria-orientation': orientation,
});

/**
 * Create ARIA attributes for menu items
 */
export const createMenuItemProps = (isDisabled: boolean = false) => ({
  role: 'menuitem',
  ...(isDisabled && { 'aria-disabled': true }),
});

/**
 * Create ARIA attributes for tab components
 */
export const createTabProps = (isSelected: boolean, controlsId: string) => ({
  role: 'tab',
  'aria-selected': isSelected,
  'aria-controls': controlsId,
  tabIndex: isSelected ? 0 : -1,
});

/**
 * Create ARIA attributes for tab panels
 */
export const createTabPanelProps = (labelledById: string) => ({
  role: 'tabpanel',
  'aria-labelledby': labelledById,
});

/**
 * Create ARIA attributes for progress indicators
 */
export const createProgressProps = (
  value: number,
  max: number = 100,
  label?: string
) => ({
  role: 'progressbar',
  'aria-valuenow': value,
  'aria-valuemax': max,
  'aria-valuemin': 0,
  ...(label && { 'aria-label': label }),
});

/**
 * Create skip link for keyboard navigation
 */
export const createSkipLink = (targetId: string, text: string = 'Skip to main content') => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded';
  
  return skipLink;
};

/**
 * Announce message to screen readers
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Format currency for screen readers
 */
export const formatCurrencyForScreenReader = (amount: number): string => {
  const formatted = (amount / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  
  // Make it more readable for screen readers
  return formatted.replace('R$', 'reais');
};

/**
 * Format multiplier for screen readers
 */
export const formatMultiplierForScreenReader = (multiplier: number): string => {
  return `${multiplier.toFixed(2)} times`;
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if user is using a screen reader
 */
export const isUsingScreenReader = (): boolean => {
  // This is a heuristic and not 100% accurate
  return (
    navigator.userAgent.includes('NVDA') ||
    navigator.userAgent.includes('JAWS') ||
    navigator.userAgent.includes('VoiceOver') ||
    window.speechSynthesis?.speaking === true
  );
};

/**
 * Keyboard event helpers
 */
export const isEnterKey = (event: KeyboardEvent): boolean => event.key === 'Enter';
export const isSpaceKey = (event: KeyboardEvent): boolean => event.key === ' ';
export const isEscapeKey = (event: KeyboardEvent): boolean => event.key === 'Escape';
export const isArrowKey = (event: KeyboardEvent): boolean => 
  ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);

/**
 * Handle keyboard activation (Enter or Space)
 */
export const handleKeyboardActivation = (
  event: KeyboardEvent,
  callback: () => void
): void => {
  if (isEnterKey(event) || isSpaceKey(event)) {
    event.preventDefault();
    callback();
  }
};
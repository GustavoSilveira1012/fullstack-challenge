/**
 * Sentry Configuration
 * Simplified for build compatibility
 */

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export const initSentry = () => {
  // Temporarily disabled for build compatibility
  console.log('Sentry initialization disabled for build');
};

/**
 * Capture exception with additional context
 */
export const captureException = (
  error: Error, 
  context?: Record<string, any>
) => {
  console.error('Error captured:', error, context);
};

/**
 * Capture message with additional context
 */
export const captureMessage = (
  message: string, 
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
) => {
  console.log(`[${level.toUpperCase()}] ${message}`, context);
};

/**
 * Set user context for error tracking
 */
export const setUserContext = (user: {
  id?: string;
  email?: string;
  username?: string;
}) => {
  console.log('User context set:', user);
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (breadcrumb: {
  message: string;
  category?: string;
  level?: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}) => {
  console.log('Breadcrumb added:', breadcrumb);
};

/**
 * Start performance transaction
 */
export const startTransaction = (name: string, op: string = 'navigation') => {
  console.log(`Transaction started: ${name} (${op})`);
  return {
    setTag: (key: string, value: string) => console.log(`Tag set: ${key}=${value}`),
    setData: (key: string, value: any) => console.log(`Data set: ${key}=`, value),
    finish: () => console.log(`Transaction finished: ${name}`)
  };
};

/**
 * Performance monitoring utilities
 */
export const performance = {
  /**
   * Measure API call performance
   */
  measureApiCall: async <T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const start = Date.now();
    try {
      const result = await apiCall();
      const duration = Date.now() - start;
      console.log(`API call ${name} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`API call ${name} failed after ${duration}ms:`, error);
      throw error;
    }
  },

  /**
   * Measure component render performance
   */
  measureRender: (componentName: string, renderFn: () => void) => {
    const start = Date.now();
    renderFn();
    const duration = Date.now() - start;
    console.log(`Component ${componentName} rendered in ${duration}ms`);
  },

  /**
   * Measure user interaction performance
   */
  measureInteraction: async (
    interactionName: string,
    interaction: () => Promise<void>
  ) => {
    const start = Date.now();
    try {
      await interaction();
      const duration = Date.now() - start;
      console.log(`Interaction ${interactionName} completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`Interaction ${interactionName} failed after ${duration}ms:`, error);
      throw error;
    }
  }
};
import { useState, useCallback, useRef, useEffect } from 'react';
import { useErrorRecovery } from './useErrorRecovery';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface AsyncOptions {
  initialData?: any;
  retryConfig?: {
    maxAttempts?: number;
    delay?: number;
    backoffMultiplier?: number;
  };
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * useAsyncState Hook: Manages async operations with loading, error, and data states
 * Requirement 2.8.1: Display loading states for all async operations
 * Requirement 3.4.2: Handle API errors gracefully
 */
export const useAsyncState = <T = any>(options: AsyncOptions = {}) => {
  const { initialData = null, onSuccess, onError } = options;
  const { withRetry, handleApiError } = useErrorRecovery();
  const mountedRef = useRef(true);

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Execute async function with loading state management
   */
  const execute = useCallback(
    async <R = T>(asyncFn: () => Promise<R>): Promise<R | null> => {
      if (!mountedRef.current) return null;

      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const result = await (options.retryConfig 
          ? withRetry(asyncFn, options.retryConfig)
          : asyncFn()
        );

        if (!mountedRef.current) return null;

        setState({
          data: result as unknown as T,
          loading: false,
          error: null,
        });

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (error) {
        if (!mountedRef.current) return null;

        const errorObj = error as Error;
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorObj,
        }));

        // Handle API errors with user-friendly messages
        handleApiError(error);

        if (onError) {
          onError(errorObj);
        }

        return null;
      }
    },
    [withRetry, handleApiError, onSuccess, onError, options.retryConfig]
  );

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
  }, [initialData]);

  /**
   * Set data directly (useful for optimistic updates)
   */
  const setData = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      error: null,
    }));
  }, []);

  /**
   * Set error directly
   */
  const setError = useCallback((error: Error) => {
    setState(prev => ({
      ...prev,
      error,
      loading: false,
    }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
    isIdle: !state.loading && !state.error && state.data === null,
    isSuccess: !state.loading && !state.error && state.data !== null,
  };
};

/**
 * useAsyncCallback Hook: Manages async callbacks with loading states
 */
export const useAsyncCallback = <T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  deps: React.DependencyList = []
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { handleApiError } = useErrorRecovery();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: T): Promise<R | null> => {
      if (!mountedRef.current) return null;

      setLoading(true);
      setError(null);

      try {
        const result = await asyncFn(...args);
        
        if (!mountedRef.current) return null;
        
        setLoading(false);
        return result;
      } catch (err) {
        if (!mountedRef.current) return null;

        const error = err as Error;
        setError(error);
        setLoading(false);
        handleApiError(error);
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleApiError, ...deps]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    execute,
    loading,
    error,
    reset,
  };
};

/**
 * useAsyncEffect Hook: useEffect with async support and loading state
 */
export const useAsyncEffect = (
  asyncFn: () => Promise<void>,
  deps: React.DependencyList,
  options: { skip?: boolean } = {}
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { handleApiError } = useErrorRecovery();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (options.skip) return;

    let cancelled = false;

    const execute = async () => {
      if (!mountedRef.current || cancelled) return;

      setLoading(true);
      setError(null);

      try {
        await asyncFn();
        
        if (!mountedRef.current || cancelled) return;
        
        setLoading(false);
      } catch (err) {
        if (!mountedRef.current || cancelled) return;

        const error = err as Error;
        setError(error);
        setLoading(false);
        handleApiError(error);
      }
    };

    execute();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { loading, error };
};
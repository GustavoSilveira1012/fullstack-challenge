import { useCallback, useEffect, useState } from 'react';

/**
 * useLocalStorage Hook: Manages localStorage persistence
 * Requirement 2.7.4: Theme preference persistence
 */
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      if (item) {
        return JSON.parse(item) as T;
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading from localStorage for key "${key}":`, error);
      return initialValue;
    }
  });

  /**
   * Return a wrapped version of useState's setter function that
   * persists the new value to localStorage
   */
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to local storage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));

        // Dispatch storage event for other tabs/windows
        try {
          window.dispatchEvent(
            new StorageEvent('storage', {
              key,
              newValue: JSON.stringify(valueToStore),
              oldValue: JSON.stringify(storedValue),
            })
          );
        } catch (eventError) {
          // Silently fail if StorageEvent dispatch fails (common in test environments)
          // The important part is that the value is persisted to localStorage
        }
      } catch (error) {
        console.error(`Error writing to localStorage for key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  /**
   * Listen for storage changes from other tabs/windows
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error) {
          console.error(`Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  /**
   * Remove item from localStorage
   */
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing from localStorage for key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
};

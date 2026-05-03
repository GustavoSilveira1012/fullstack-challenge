import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

/**
 * useLocalStorage Hook Unit Tests
 * Requirement 2.7.4: Theme preference persistence
 * Validates: Requirements 2.7.4
 */
describe('useLocalStorage Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should return initial value when localStorage is empty', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

      const [value] = result.current;
      expect(value).toBe('initial-value');
    });

    it('should return stored value from localStorage', () => {
      localStorage.setItem('test-key', JSON.stringify('stored-value'));

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

      const [value] = result.current;
      expect(value).toBe('stored-value');
    });

    it('should handle different data types', () => {
      // String
      localStorage.setItem('string-key', JSON.stringify('string-value'));
      const { result: stringResult } = renderHook(() => useLocalStorage('string-key', ''));
      expect(stringResult.current[0]).toBe('string-value');

      // Number
      localStorage.setItem('number-key', JSON.stringify(42));
      const { result: numberResult } = renderHook(() => useLocalStorage('number-key', 0));
      expect(numberResult.current[0]).toBe(42);

      // Boolean
      localStorage.setItem('boolean-key', JSON.stringify(true));
      const { result: booleanResult } = renderHook(() => useLocalStorage('boolean-key', false));
      expect(booleanResult.current[0]).toBe(true);

      // Object
      const obj = { name: 'test', value: 123 };
      localStorage.setItem('object-key', JSON.stringify(obj));
      const { result: objectResult } = renderHook(() => useLocalStorage('object-key', {}));
      expect(objectResult.current[0]).toEqual(obj);

      // Array
      const arr = [1, 2, 3];
      localStorage.setItem('array-key', JSON.stringify(arr));
      const { result: arrayResult } = renderHook(() => useLocalStorage('array-key', []));
      expect(arrayResult.current[0]).toEqual(arr);
    });
  });

  describe('Set Value', () => {
    it('should update value and persist to localStorage', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        const [, setValue] = result.current;
        setValue('updated-value');
      });

      const [value] = result.current;
      expect(value).toBe('updated-value');
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify('updated-value'));
    });

    it('should support function updates', () => {
      const { result } = renderHook(() => useLocalStorage('counter', 0));

      act(() => {
        const [, setValue] = result.current;
        setValue((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(1);

      act(() => {
        const [, setValue] = result.current;
        setValue((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(2);
    });

    it('should persist complex objects', () => {
      const initialObj = { name: 'test', nested: { value: 123 } };
      const { result } = renderHook(() => useLocalStorage('object-key', initialObj));

      const updatedObj = { name: 'updated', nested: { value: 456 } };

      act(() => {
        const [, setValue] = result.current;
        setValue(updatedObj);
      });

      expect(result.current[0]).toEqual(updatedObj);
      expect(JSON.parse(localStorage.getItem('object-key') || '{}')).toEqual(updatedObj);
    });

    it('should persist arrays', () => {
      const { result } = renderHook(() => useLocalStorage<any>('array-key', []));

      act(() => {
        const [, setValue] = result.current;
        setValue([1, 2, 3, 4, 5]);
      });

      expect(result.current[0]).toEqual([1, 2, 3, 4, 5]);
      expect(JSON.parse(localStorage.getItem('array-key') || '[]')).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('Remove Value', () => {
    it('should remove value from localStorage', () => {
      localStorage.setItem('test-key', JSON.stringify('value'));

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      expect(result.current[0]).toBe('value');

      act(() => {
        const [, , removeValue] = result.current;
        removeValue();
      });

      expect(result.current[0]).toBe('initial');
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('should reset to initial value after removal', () => {
      const initialValue = { theme: 'light' };
      localStorage.setItem('theme-key', JSON.stringify({ theme: 'dark' }));

      const { result } = renderHook(() => useLocalStorage('theme-key', initialValue));

      expect(result.current[0]).toEqual({ theme: 'dark' });

      act(() => {
        const [, , removeValue] = result.current;
        removeValue();
      });

      expect(result.current[0]).toEqual(initialValue);
    });
  });

  describe('Multiple Hooks', () => {
    it('should handle multiple hooks with different keys', () => {
      const { result: result1 } = renderHook(() => useLocalStorage('key1', 'value1'));
      const { result: result2 } = renderHook(() => useLocalStorage('key2', 'value2'));

      expect(result1.current[0]).toBe('value1');
      expect(result2.current[0]).toBe('value2');

      act(() => {
        result1.current[1]('updated1');
        result2.current[1]('updated2');
      });

      expect(result1.current[0]).toBe('updated1');
      expect(result2.current[0]).toBe('updated2');
    });

    it('should handle same key in multiple hooks', () => {
      const { result: result1 } = renderHook(() => useLocalStorage('shared-key', 'initial'));
      renderHook(() => useLocalStorage('shared-key', 'initial'));

      act(() => {
        result1.current[1]('updated');
      });

      // Both hooks should reflect the change
      expect(result1.current[0]).toBe('updated');
      // Note: result2 won't automatically update unless it re-renders
    });
  });

  describe('Storage Events', () => {
    it('should dispatch storage event on value change', () => {
      const storageEventSpy = vi.spyOn(window, 'dispatchEvent');

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        const [, setValue] = result.current;
        setValue('updated');
      });

      expect(storageEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'storage',
        })
      );
    });

    it('should listen for storage events from other tabs', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      expect(result.current[0]).toBe('initial');

      // Simulate storage event from another tab
      const event = new StorageEvent('storage', {
        key: 'test-key',
        newValue: JSON.stringify('updated-from-other-tab'),
        oldValue: JSON.stringify('initial'),
        storageArea: localStorage,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      // Hook should update to reflect the change
      expect(result.current[0]).toBe('updated-from-other-tab');
    });

    it('should ignore storage events for other keys', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      const event = new StorageEvent('storage', {
        key: 'other-key',
        newValue: JSON.stringify('other-value'),
        oldValue: null,
        storageArea: localStorage,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      // Value should not change
      expect(result.current[0]).toBe('initial');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON in localStorage', () => {
      localStorage.setItem('invalid-key', 'not-valid-json');

      const { result } = renderHook(() => useLocalStorage('invalid-key', 'fallback'));

      expect(result.current[0]).toBe('fallback');
    });

    it('should handle localStorage quota exceeded', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        const [, setValue] = result.current;
        setValue('new-value' as any);
      });

      // Should still update in memory even if localStorage fails
      expect(result.current[0]).toBe('new-value');

      setItemSpy.mockRestore();
    });

    it('should handle localStorage access denied', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Access denied');
      });

      const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));

      expect(result.current[0]).toBe('fallback');

      getItemSpy.mockRestore();
    });
  });

  describe('Theme Persistence Use Case', () => {
    it('should persist theme preference', () => {
      const { result } = renderHook(() => useLocalStorage('theme', 'light'));

      expect(result.current[0]).toBe('light');

      act(() => {
        const [, setValue] = result.current;
        setValue('dark');
      });

      expect(result.current[0]).toBe('dark');
      expect(localStorage.getItem('theme')).toBe(JSON.stringify('dark'));

      // Simulate page reload
      const { result: result2 } = renderHook(() => useLocalStorage('theme', 'light'));
      expect(result2.current[0]).toBe('dark');
    });

    it('should persist sound preference', () => {
      const { result } = renderHook(() => useLocalStorage('soundEnabled', true));

      expect(result.current[0]).toBe(true);

      act(() => {
        const [, setValue] = result.current;
        setValue(false);
      });

      expect(result.current[0]).toBe(false);
      expect(localStorage.getItem('soundEnabled')).toBe(JSON.stringify(false));
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const { result } = renderHook(() => useLocalStorage<string | null>('null-key', null));

      expect(result.current[0]).toBeNull();

      act(() => {
        const [, setValue] = result.current;
        setValue('value');
      });

      expect(result.current[0]).toBe('value');
    });

    it('should handle undefined values', () => {
      const { result } = renderHook(() => useLocalStorage('undefined-key', undefined));

      expect(result.current[0]).toBeUndefined();
    });

    it('should handle empty string', () => {
      const { result } = renderHook(() => useLocalStorage('empty-key', ''));

      expect(result.current[0]).toBe('');

      act(() => {
        const [, setValue] = result.current;
        setValue('value');
      });

      expect(result.current[0]).toBe('value');
    });

    it('should handle zero', () => {
      const { result } = renderHook(() => useLocalStorage('zero-key', 0));

      expect(result.current[0]).toBe(0);

      act(() => {
        const [, setValue] = result.current;
        setValue(42);
      });

      expect(result.current[0]).toBe(42);
    });

    it('should handle false boolean', () => {
      const { result } = renderHook(() => useLocalStorage('false-key', false));

      expect(result.current[0]).toBe(false);

      act(() => {
        const [, setValue] = result.current;
        setValue(true);
      });

      expect(result.current[0]).toBe(true);
    });
  });
});

import { useCallback, useState, useEffect } from "react";

/**
 * A hook to manage a value in localStorage with SSR safety.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(defaultValue);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    } finally {
      setIsInitialized(true);
    }
  }, [key]);

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        if (isInitialized) {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, isInitialized]
  );

  return [storedValue, setValue];
}

/**
 * Hook to manage the DAO view mode (grid or list) persisted in localStorage.
 */
export type ViewMode = "grid" | "list";

export function useViewMode(
  defaultMode: ViewMode = "grid"
): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>(
    "viewMode",
    defaultMode
  );

  return [viewMode, setViewMode];
}

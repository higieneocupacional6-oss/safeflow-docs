import { useEffect, useState } from "react";

/**
 * useState that persists in sessionStorage across navigations within the SPA.
 * Useful to avoid losing form/modal data when the component unmounts (route change)
 * or when the browser tab loses focus.
 *
 * The value is JSON-serialized. Pass a stable, unique `key`.
 */
export function usePersistedState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const raw = window.sessionStorage.getItem(key);
      if (raw == null) return initialValue;
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [key, state]);

  return [state, setState] as const;
}

/** Remove a persisted key (use when the modal is saved/cancelled explicitly). */
export function clearPersistedState(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

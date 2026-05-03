import { useEffect, useRef, useState } from "react";

/**
 * useState that persists in sessionStorage across navigations within the SPA.
 * Useful to avoid losing form/modal data when the component unmounts (route change)
 * or when the browser tab loses focus.
 *
 * The value is JSON-serialized. Pass a stable, unique `key`.
 *
 * If `key` changes at runtime, the state is re-hydrated from the new storage slot
 * instead of overwriting it with the previous value.
 */
function readFromStorage<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") return initialValue;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw == null) return initialValue;
    return JSON.parse(raw) as T;
  } catch {
    return initialValue;
  }
}

export function usePersistedState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => readFromStorage(key, initialValue));
  const prevKeyRef = useRef(key);

  // Re-hydrate when the key changes (e.g. switching between documents/scopes).
  useEffect(() => {
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key;
      setState(readFromStorage(key, initialValue));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

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

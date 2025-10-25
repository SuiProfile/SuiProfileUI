// A safe localStorage wrapper that works in SSR and private mode,
// and exposes an API similar to the Web Storage interface.

export interface StorageLike {
  readonly length: number;
  clear(): void;
  getItem(key: string): string | null;
  key(index: number): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

type ChangeListener = (key: string, newValue: string | null, oldValue: string | null) => void;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function getNativeStorage(): Storage | null {
  if (!isBrowser()) return null;
  try {
    const s = window.localStorage;
    const testKey = "__storage_test__";
    s.setItem(testKey, "1");
    s.removeItem(testKey);
    return s;
  } catch {
    return null;
  }
}

// Minimal in-memory storage fallback that mimics the Storage API
function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      if (index < 0 || index >= map.size) return null;
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    }
  };
}

// Wrap a backing storage and add helpers and change notifications
function wrapStorage(backing: Storage | StorageLike) {
  const listeners = new Set<ChangeListener>();

  const api: StorageLike & {
    has: (key: string) => boolean;
    setJSON: (key: string, value: unknown) => void;
    getJSON: <T = unknown>(key: string, fallback?: T) => T | null;
    onChange: (cb: ChangeListener) => () => void;
  } = {
    get length() {
      return backing.length;
    },
    clear() {
      // capture prior keys/values for notifications
      const keys: string[] = [];
      for (let i = 0; i < backing.length; i++) {
        const k = backing.key(i);
        if (k) keys.push(k);
      }
      backing.clear();
      keys.forEach((k) => listeners.forEach((l) => l(k, null, null)));
    },
    getItem(key: string) {
      return backing.getItem(key as any);
    },
    key(index: number) {
      return backing.key(index as any);
    },
    removeItem(key: string) {
      const oldValue = backing.getItem(key as any);
      backing.removeItem(key as any);
      listeners.forEach((l) => l(key, null, oldValue));
    },
    setItem(key: string, value: string) {
      const oldValue = backing.getItem(key as any);
      backing.setItem(key as any, value);
      listeners.forEach((l) => l(key, value, oldValue));
    },
    has(key: string) {
      return api.getItem(key) !== null;
    },
    setJSON(key: string, value: unknown) {
      api.setItem(key, JSON.stringify(value));
    },
    getJSON<T = unknown>(key: string, fallback?: T) {
      const raw = api.getItem(key);
      if (raw == null) return fallback ?? null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return fallback ?? null;
      }
    },
    onChange(cb: ChangeListener) {
      listeners.add(cb);
      const off = () => listeners.delete(cb);
      return off;
    }
  };

  // Forward native storage events (other tabs) to our listeners
  if (isBrowser()) {
    window.addEventListener("storage", (e) => {
      if (!e.key) return;
      listeners.forEach((l) => l(e.key!, e.newValue, e.oldValue));
    });
  }

  return api;
}

const native = getNativeStorage();
const base = native ?? createMemoryStorage();

export const storage = wrapStorage(base);

export function namespacedStorage(prefix: string) {
  const p = prefix.endsWith(":") ? prefix : `${prefix}:`;
  return {
    get length() {
      // Not efficiently supported for namespaces; returns total length
      return storage.length;
    },
    clear() {
      const keys: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith(p)) keys.push(k);
      }
      keys.forEach((k) => storage.removeItem(k));
    },
    getItem(key: string) {
      return storage.getItem(p + key);
    },
    key(index: number) {
      return storage.key(index);
    },
    removeItem(key: string) {
      storage.removeItem(p + key);
    },
    setItem(key: string, value: string) {
      storage.setItem(p + key, value);
    },
    has(key: string) {
      return storage.getItem(p + key) !== null;
    },
    setJSON(key: string, value: unknown) {
      storage.setItem(p + key, JSON.stringify(value));
    },
    getJSON<T = unknown>(key: string, fallback?: T) {
      const raw = storage.getItem(p + key);
      if (raw == null) return fallback ?? null;
      try { return JSON.parse(raw) as T; } catch { return fallback ?? null; }
    },
    onChange(cb: ChangeListener) {
      return storage.onChange((k, nv, ov) => {
        if (k.startsWith(p)) cb(k.slice(p.length), nv, ov);
      });
    }
  } as ReturnType<typeof wrapStorage>;
}

export default storage;



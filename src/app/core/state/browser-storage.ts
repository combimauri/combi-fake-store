import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * A `localStorage` accessor that degrades to a no-op on the server.
 *
 * The app is server-rendered, so every store that persists state has to run
 * during SSR where `localStorage` does not exist. Reads return `undefined`
 * there and the store falls back to its initial value, which then hydrates on
 * the client. Writes are also guarded against private-mode quota errors.
 *
 * Must be called from an injection context.
 */
export function createStorage(namespace: string) {
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  const key = (name: string) => `fake-store:${namespace}:${name}`;

  return {
    isBrowser,

    read<T>(name: string): T | undefined {
      if (!isBrowser) return undefined;
      try {
        const raw = localStorage.getItem(key(name));
        return raw === null ? undefined : (JSON.parse(raw) as T);
      } catch {
        return undefined;
      }
    },

    write(name: string, value: unknown): void {
      if (!isBrowser) return;
      try {
        localStorage.setItem(key(name), JSON.stringify(value));
      } catch {
        // Quota exceeded or storage disabled; persistence is best-effort.
      }
    },

    remove(name: string): void {
      if (!isBrowser) return;
      try {
        localStorage.removeItem(key(name));
      } catch {
        // Ignore.
      }
    },
  };
}

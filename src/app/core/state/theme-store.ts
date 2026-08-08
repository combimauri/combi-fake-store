import { DOCUMENT } from '@angular/common';
import { Service, computed, effect, inject, signal } from '@angular/core';

import { createStorage } from './browser-storage';

export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Light/dark preference, applied as a `dark` class on the document element.
 *
 * `system` is the default and follows the OS; choosing light or dark pins it
 * and survives a reload.
 */
@Service()
export class ThemeStore {
  private readonly document = inject(DOCUMENT);
  private readonly storage = createStorage('theme');

  private readonly preference = signal<ThemePreference>(
    this.storage.read<ThemePreference>('preference') ?? 'system',
  );
  /** Tracks the OS setting so `system` re-evaluates when the user flips it. */
  private readonly systemPrefersDark = signal(false);

  readonly current = this.preference.asReadonly();
  readonly isDark = computed(() =>
    this.preference() === 'system' ? this.systemPrefersDark() : this.preference() === 'dark',
  );

  constructor() {
    // `matchMedia` is missing during SSR and in some test environments, and
    // older browsers only expose the deprecated `addListener`. Both are
    // tolerated: without it the preference simply never tracks the OS.
    const view = this.document.defaultView;
    if (this.storage.isBrowser && typeof view?.matchMedia === 'function') {
      const query = view.matchMedia('(prefers-color-scheme: dark)');
      this.systemPrefersDark.set(query.matches);

      if (typeof query.addEventListener === 'function') {
        query.addEventListener('change', (event) => this.systemPrefersDark.set(event.matches));
      }
    }

    effect(() => {
      this.document.documentElement.classList.toggle('dark', this.isDark());
    });
  }

  set(preference: ThemePreference): void {
    this.preference.set(preference);
    this.storage.write('preference', preference);
  }

  /** Cycles light to dark and back, pinning the choice either way. */
  toggle(): void {
    this.set(this.isDark() ? 'light' : 'dark');
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ThemeStore } from '../../../core/state/theme-store';
import { Icon } from '../icon/icon';

/** Switches between light and dark, pinning the choice. */
@Component({
  selector: 'combi-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <button
      type="button"
      class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full
             text-muted-foreground transition-colors hover:bg-surface-sunken hover:text-foreground"
      [attr.aria-label]="theme.isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
      [attr.aria-pressed]="theme.isDark()"
      (click)="theme.toggle()"
    >
      <combi-icon [name]="theme.isDark() ? 'sun' : 'moon'" [size]="18" />
    </button>
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeStore);
}

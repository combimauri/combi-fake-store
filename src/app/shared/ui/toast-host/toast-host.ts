import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastStore } from '../../../core/state/toast-store';
import { Icon } from '../icon/icon';

/**
 * Renders queued toasts in a corner overlay.
 *
 * `aria-live="polite"` announces new messages without moving focus, and each
 * tone carries an icon so meaning never rests on colour alone.
 */
@Component({
  selector: 'combi-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 bottom-0 z-100 flex flex-col items-center gap-2 p-4 sm:items-end"
      role="status"
      aria-live="polite"
    >
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-3
                 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm"
          [class]="toneClass(toast.tone)"
        >
          <combi-icon [name]="toneIcon(toast.tone)" [size]="18" class="mt-0.5" />
          <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>
          <button
            type="button"
            class="cursor-pointer rounded p-1 opacity-60 transition-opacity hover:opacity-100"
            aria-label="Dismiss notification"
            (click)="toasts.dismiss(toast.id)"
          >
            <combi-icon name="close" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  protected readonly toasts = inject(ToastStore);

  protected toneClass(tone: string): string {
    switch (tone) {
      case 'success':
        return 'bg-success-soft text-success border-success/30';
      case 'error':
        return 'bg-destructive-soft text-destructive border-destructive/30';
      default:
        return 'bg-surface-raised text-foreground';
    }
  }

  protected toneIcon(tone: string): 'check' | 'alert' | 'info' {
    switch (tone) {
      case 'success':
        return 'check';
      case 'error':
        return 'alert';
      default:
        return 'info';
    }
  }
}

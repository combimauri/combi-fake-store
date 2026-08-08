import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Confirmation for destructive actions.
 *
 * Uses the native `<dialog>`-style semantics via role/aria rather than a real
 * `<dialog>` element, because `showModal()` is unavailable during SSR. Escape
 * and backdrop clicks both cancel, so there is always a way out.
 */
/** Stable across server and client render, unlike a random id. */
let dialogSeq = 0;

@Component({
  selector: 'combi-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-100 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        (keydown.escape)="cancel.emit()"
        tabindex="-1"
      >
        <!-- Scrim strong enough to isolate the dialog from the page behind it. -->
        <button
          type="button"
          class="absolute inset-0 cursor-default bg-[var(--overlay)] backdrop-blur-[2px]"
          aria-label="Cancel"
          (click)="cancel.emit()"
        ></button>

        <div class="card animate-rise relative w-full max-w-sm p-6 shadow-2xl">
          <h2 [id]="titleId" class="text-lg font-semibold">{{ title() }}</h2>
          <p class="mt-2 text-sm text-muted-foreground">{{ message() }}</p>

          <div class="mt-6 flex justify-end gap-2">
            <button type="button" class="btn btn-outline btn-sm" (click)="cancel.emit()">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-danger btn-sm"
              [disabled]="busy()"
              (click)="confirm.emit()"
            >
              {{ busy() ? 'Working…' : confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  readonly open = input(false);
  readonly title = input('Are you sure?');
  readonly message = input('This action cannot be undone.');
  readonly confirmLabel = input('Delete');
  readonly busy = input(false);

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  protected readonly titleId = `confirm-dialog-${dialogSeq++}`;
}

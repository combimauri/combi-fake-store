import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';

/**
 * An image that degrades gracefully.
 *
 * Product images come from a database anyone can write to, so URLs are
 * routinely broken, malformed, or missing. This renders a neutral placeholder
 * instead of a broken-image glyph, and reserves the aspect ratio up front so
 * loading never shifts the layout.
 */
@Component({
  selector: 'combi-safe-image',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative overflow-hidden bg-surface-sunken" [style.aspect-ratio]="ratio()">
      @if (usable() && !failed()) {
        <img
          [src]="src()"
          [alt]="alt()"
          [attr.loading]="eager() ? 'eager' : 'lazy'"
          [attr.fetchpriority]="eager() ? 'high' : 'auto'"
          decoding="async"
          class="h-full w-full object-cover transition-[opacity,transform] duration-500"
          [class.opacity-0]="!loaded()"
          [class.scale-105]="!loaded()"
          (load)="loaded.set(true)"
          (error)="failed.set(true)"
        />
      } @else {
        <div
          class="flex h-full w-full items-center justify-center text-muted-foreground"
          role="img"
          [attr.aria-label]="alt() || 'Image unavailable'"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path
              d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM21 15l-5-5L5 21"
            />
          </svg>
        </div>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class SafeImage {
  readonly src = input<string | undefined>(undefined);
  readonly alt = input('');
  /** CSS aspect-ratio, e.g. `1 / 1` or `4 / 5`. */
  readonly ratio = input('1 / 1');
  /** Set on above-the-fold images so they are not lazily fetched. */
  readonly eager = input(false);

  // Keyed on `src` so swapping the gallery image clears a previous failure
  // and replays the fade-in instead of staying stuck on the placeholder.
  protected readonly loaded = linkedSignal<string | undefined, boolean>({
    source: this.src,
    computation: () => false,
  });
  protected readonly failed = linkedSignal<string | undefined, boolean>({
    source: this.src,
    computation: () => false,
  });

  /** Rejects empty strings and the non-URL junk the shared database contains. */
  protected readonly usable = computed(() => {
    const value = this.src()?.trim();
    return !!value && /^https?:\/\//i.test(value);
  });
}

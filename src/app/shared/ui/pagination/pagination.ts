import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Icon } from '../icon/icon';

/** Page numbers around the current page, with gaps marked by `null`. */
const WINDOW = 1;

@Component({
  selector: 'combi-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    @if (totalPages() > 1) {
      <nav class="flex items-center justify-center gap-1" aria-label="Pagination">
        <button
          type="button"
          class="btn btn-ghost btn-sm !px-2"
          [disabled]="page() === 1"
          aria-label="Previous page"
          (click)="pageChange.emit(page() - 1)"
        >
          <combi-icon name="chevronLeft" [size]="16" />
        </button>

        @for (slot of slots(); track $index) {
          @if (slot === null) {
            <span class="px-1.5 text-sm text-muted-foreground" aria-hidden="true">…</span>
          } @else {
            <button
              type="button"
              class="tabular h-9 min-w-9 cursor-pointer rounded-full px-2 text-sm font-semibold transition-colors"
              [class]="
                slot === page()
                  ? 'bg-primary text-on-primary'
                  : 'text-muted-foreground hover:bg-surface-sunken hover:text-foreground'
              "
              [attr.aria-label]="'Go to page ' + slot"
              [attr.aria-current]="slot === page() ? 'page' : null"
              (click)="pageChange.emit(slot)"
            >
              {{ slot }}
            </button>
          }
        }

        <button
          type="button"
          class="btn btn-ghost btn-sm !px-2"
          [disabled]="page() === totalPages()"
          aria-label="Next page"
          (click)="pageChange.emit(page() + 1)"
        >
          <combi-icon name="chevronRight" [size]="16" />
        </button>
      </nav>
    }
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();

  readonly pageChange = output<number>();

  protected readonly slots = computed<(number | null)[]>(() => {
    const total = this.totalPages();
    const current = this.page();
    const pages = new Set<number>([1, total]);

    for (let i = current - WINDOW; i <= current + WINDOW; i++) {
      if (i > 1 && i < total) pages.add(i);
    }

    const sorted = [...pages].sort((a, b) => a - b);
    const slots: (number | null)[] = [];
    let previous = 0;

    for (const value of sorted) {
      if (previous && value - previous > 1) slots.push(null);
      slots.push(value);
      previous = value;
    }

    return slots;
  });
}

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Icon } from '../icon/icon';

/** Accessible -/+ control for a cart line quantity. */
@Component({
  selector: 'combi-quantity-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div
      class="inline-flex items-center rounded-full border"
      role="group"
      [attr.aria-label]="'Quantity for ' + label()"
    >
      <button
        type="button"
        class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-l-full
               text-muted-foreground transition-colors hover:bg-surface-sunken
               hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        [disabled]="quantity() <= min()"
        [attr.aria-label]="'Decrease quantity of ' + label()"
        (click)="quantityChange.emit(quantity() - 1)"
      >
        <combi-icon name="minus" [size]="16" />
      </button>

      <span
        class="tabular w-10 text-center text-sm font-semibold"
        aria-live="polite"
        [attr.aria-label]="quantity() + ' in cart'"
      >
        {{ quantity() }}
      </span>

      <button
        type="button"
        class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-r-full
               text-muted-foreground transition-colors hover:bg-surface-sunken
               hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        [disabled]="quantity() >= max()"
        [attr.aria-label]="'Increase quantity of ' + label()"
        (click)="quantityChange.emit(quantity() + 1)"
      >
        <combi-icon name="plus" [size]="16" />
      </button>
    </div>
  `,
})
export class QuantityStepper {
  readonly quantity = input.required<number>();
  /** Product name, used to make each control's label unique to screen readers. */
  readonly label = input('item');
  readonly min = input(1);
  readonly max = input(99);

  readonly quantityChange = output<number>();
}

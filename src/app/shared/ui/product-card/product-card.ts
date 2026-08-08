import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../../../core/models';
import { Icon } from '../icon/icon';
import { SafeImage } from '../safe-image/safe-image';

/** Catalog tile linking to a product, with a quick add-to-cart affordance. */
@Component({
  selector: 'combi-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, Icon, RouterLink, SafeImage],
  template: `
    <article class="group card flex h-full flex-col overflow-hidden">
      <a
        [routerLink]="['/products', product().slug]"
        class="relative block overflow-hidden"
        [attr.aria-label]="product().title"
        tabindex="-1"
      >
        <combi-safe-image
          [src]="product().images[0]"
          [alt]="product().title"
          ratio="4 / 5"
          [eager]="eager()"
          class="transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span
          class="absolute top-3 left-3 rounded-full bg-surface-raised/90 px-2.5 py-1
                 text-[11px] font-semibold text-muted-foreground backdrop-blur-sm"
        >
          {{ product().category.name }}
        </span>
      </a>

      <div class="flex flex-1 flex-col gap-3 p-4">
        <div class="flex-1">
          <h3 class="line-clamp-2 text-sm leading-snug font-semibold">
            <a
              [routerLink]="['/products', product().slug]"
              class="transition-colors hover:text-accent"
            >
              {{ product().title }}
            </a>
          </h3>
          <p class="tabular mt-1.5 font-display text-lg font-semibold">
            {{ product().price | currency: 'USD' }}
          </p>
        </div>

        <button
          type="button"
          class="btn btn-sm w-full"
          [class]="inCart() ? 'btn-outline' : 'btn-primary'"
          [attr.aria-label]="(inCart() ? 'Add another ' : 'Add ') + product().title + ' to cart'"
          (click)="add.emit(product())"
        >
          <combi-icon [name]="inCart() ? 'check' : 'cart'" [size]="15" />
          {{ inCart() ? 'In cart (' + quantityInCart() + ')' : 'Add to cart' }}
        </button>
      </div>
    </article>
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly quantityInCart = input(0);
  /** Set on the first row so hero imagery is not lazy-loaded. */
  readonly eager = input(false);

  readonly add = output<Product>();

  protected readonly inCart = computed(() => this.quantityInCart() > 0);
}

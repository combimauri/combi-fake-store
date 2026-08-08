import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';

import { Product, toApiError } from '../../../core/models';
import { ProductApi } from '../../../core/services/product-api';
import { CartStore } from '../../../core/state/cart-store';
import { ToastStore } from '../../../core/state/toast-store';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Icon } from '../../../shared/ui/icon/icon';
import { ProductCard } from '../../../shared/ui/product-card/product-card';
import { SafeImage } from '../../../shared/ui/safe-image/safe-image';

/**
 * Product detail, addressed by slug.
 *
 * Slugs are used instead of ids because the shared database is reseeded daily:
 * a bookmarked id breaks the next morning, whereas a slug survives as long as
 * the record does.
 */
@Component({
  selector: 'combi-product-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, EmptyState, Icon, ProductCard, RouterLink, SafeImage],
  templateUrl: './product-detail.html',
})
export class ProductDetail {
  private readonly productApi = inject(ProductApi);
  private readonly route = inject(ActivatedRoute);
  private readonly cart = inject(CartStore);
  private readonly toasts = inject(ToastStore);

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  protected readonly slug = computed(() => this.params().get('slug') ?? undefined);

  protected readonly product = this.productApi.productBySlugResource(this.slug);
  protected readonly related = this.productApi.relatedProductsResource(this.slug);

  protected readonly error = computed(() => {
    const failure = this.product.error();
    return failure ? toApiError(failure) : undefined;
  });

  /** True when the API says the record is gone, as opposed to a real outage. */
  protected readonly notFound = computed(() => this.error()?.kind === 'not-found');

  protected readonly images = computed(() => {
    const all = this.product.value()?.images ?? [];
    const usable = all.filter((url) => /^https?:\/\//i.test(url.trim()));
    return usable.length > 0 ? usable : [''];
  });

  /** Resets to the first image whenever a different product loads. */
  protected readonly activeImage = linkedSignal<readonly string[], string>({
    source: this.images,
    computation: (images) => images[0],
  });

  protected readonly quantityInCart = computed(() => {
    const id = this.product.value()?.id;
    return id === undefined ? 0 : this.cart.quantityOf(id);
  });

  protected readonly relatedProducts = computed(() =>
    this.related
      .value()
      .filter((item) => item.slug !== this.slug())
      .slice(0, 4),
  );

  protected addToCart(product: Product): void {
    this.cart.add(product);
    this.toasts.success(`${product.title} added to your cart.`);
  }

  protected addRelated(product: Product): void {
    this.cart.add(product);
    this.toasts.success(`${product.title} added to your cart.`);
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { Product, ProductQuery, toApiError } from '../../../core/models';
import { ProductApi } from '../../../core/services/product-api';
import { CartStore } from '../../../core/state/cart-store';
import { ToastStore } from '../../../core/state/toast-store';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Icon } from '../../../shared/ui/icon/icon';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { ProductCard } from '../../../shared/ui/product-card/product-card';
import { FilterPanel } from '../filter-panel/filter-panel';

const PAGE_SIZE = 12;

/** One entry per category present in the current results. */
export interface CategoryFacet {
  readonly slug: string;
  readonly name: string;
  readonly count: number;
}

export type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'title-asc';

const SORTERS: Record<SortKey, (a: Product, b: Product) => number> = {
  featured: () => 0,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  'title-asc': (a, b) => a.title.localeCompare(b.title),
};

/**
 * The storefront catalog.
 *
 * Filters live in the URL so a filtered view can be shared, bookmarked, and
 * restored by the back button.
 *
 * Paging, sorting and category filtering are done client-side over the full
 * result set. That is a deliberate response to three API limits: there is no
 * total-count header (so sizing a paginator already requires fetching the
 * unpaginated list), there is no sort parameter (so server-side paging would
 * only ever sort within a page), and `GET /categories` returns hundreds of
 * empty test records created by other users of the shared database.
 *
 * Deriving the category list from the products actually returned solves the
 * last problem without brittle name matching: a category nobody has assigned a
 * product to simply never appears, and each one carries a real count. The whole
 * view costs one request, and the dataset is a couple of hundred products.
 */
@Component({
  selector: 'combi-catalog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, FilterPanel, Icon, Pagination, ProductCard],
  templateUrl: './catalog.html',
})
export class Catalog {
  private readonly productApi = inject(ProductApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cart = inject(CartStore);
  private readonly toasts = inject(ToastStore);

  private readonly params = toSignal(this.route.queryParamMap, {
    requireSync: true,
  });

  private readonly searchInput = new Subject<string>();

  // --- URL-derived state ----------------------------------------------------

  protected readonly search = computed(() => this.params().get('q') ?? '');
  protected readonly category = computed(() => this.params().get('category') ?? undefined);
  protected readonly minPrice = computed(() => toNumber(this.params().get('min')));
  protected readonly maxPrice = computed(() => toNumber(this.params().get('max')));
  protected readonly sort = computed<SortKey>(() => {
    const value = this.params().get('sort');
    return value && value in SORTERS ? (value as SortKey) : 'featured';
  });
  protected readonly page = computed(() => Math.max(1, toNumber(this.params().get('page')) ?? 1));

  /** Local mirror of the search box so typing stays responsive pre-debounce. */
  protected readonly searchDraft = signal(this.search());

  // --- Data -----------------------------------------------------------------

  /**
   * Category is deliberately left out of the request so the facet counts stay
   * stable while a category is selected; it is applied client-side below.
   */
  private readonly query = computed<ProductQuery>(() => ({
    title: this.search() || undefined,
    priceMin: this.minPrice(),
    priceMax: this.maxPrice(),
  }));

  protected readonly products = this.productApi.productsResource(this.query);

  protected readonly error = computed(() => {
    const failure = this.products.error();
    return failure ? toApiError(failure) : undefined;
  });

  /** Categories present in the current results, most populated first. */
  protected readonly facets = computed<CategoryFacet[]>(() => {
    const counts = new Map<string, CategoryFacet>();

    for (const product of this.products.value()) {
      const { slug, name } = product.category;
      const existing = counts.get(slug);
      counts.set(
        slug,
        existing ? { ...existing, count: existing.count + 1 } : { slug, name, count: 1 },
      );
    }

    return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  });

  private readonly inCategory = computed(() => {
    const slug = this.category();
    const items = this.products.value();
    return slug ? items.filter((p) => p.category.slug === slug) : items;
  });

  protected readonly sorted = computed(() => {
    const items = [...this.inCategory()];
    // `featured` keeps the API's own order, so skip sorting entirely.
    return this.sort() === 'featured' ? items : items.sort(SORTERS[this.sort()]);
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sorted().length / PAGE_SIZE)),
  );

  protected readonly pageItems = computed(() => {
    // Clamp so a stale `page=9` from the URL still renders the last page.
    const page = Math.min(this.page(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE;
    return this.sorted().slice(start, start + PAGE_SIZE);
  });

  protected readonly resultCount = computed(() => this.sorted().length);
  protected readonly hasActiveFilters = computed(
    () =>
      !!this.search() ||
      !!this.category() ||
      this.minPrice() !== undefined ||
      this.maxPrice() !== undefined,
  );

  protected readonly skeletons = Array.from({ length: PAGE_SIZE });

  constructor() {
    this.searchInput
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => this.patchParams({ q: value || undefined, page: undefined }));
  }

  // --- Intent ---------------------------------------------------------------

  protected onSearch(value: string): void {
    this.searchDraft.set(value);
    this.searchInput.next(value.trim());
  }

  protected onCategory(slug: string | undefined): void {
    this.patchParams({ category: slug, page: undefined });
  }

  protected onPrice(range: { min?: number; max?: number }): void {
    this.patchParams({ min: range.min, max: range.max, page: undefined });
  }

  protected onSort(value: string): void {
    this.patchParams({ sort: value === 'featured' ? undefined : value, page: undefined });
  }

  protected onPage(page: number): void {
    this.patchParams({ page: page === 1 ? undefined : page });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  protected clearFilters(): void {
    this.searchDraft.set('');
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  protected addToCart(product: Product): void {
    this.cart.add(product);
    this.toasts.success(`${product.title} added to your cart.`);
  }

  protected quantityOf(productId: number): number {
    return this.cart.quantityOf(productId);
  }

  /**
   * Merges params into the URL, dropping keys set to `undefined`.
   *
   * Uses `replaceUrl` so tweaking filters does not bury the previous page under
   * a stack of history entries.
   */
  private patchParams(changes: Record<string, string | number | undefined>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: changes,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}

function toNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

import { HttpClient, HttpResourceRef, httpResource } from '@angular/common/http';
import { Injector, Service, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateProduct,
  Product,
  ProductFilters,
  ProductQuery,
  UpdateProduct,
  toApiError,
} from '../models';

/**
 * Translates a {@link ProductQuery} into query-string parameters.
 *
 * `limit` and `offset` are emitted as a pair on purpose: the API ignores
 * `limit` when `offset` is absent and returns the whole collection instead.
 */
function toQueryParams(query: ProductQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {};

  if (query.title) params['title'] = query.title;
  if (query.price !== undefined) params['price'] = query.price;
  if (query.priceMin !== undefined) params['price_min'] = query.priceMin;
  if (query.priceMax !== undefined) params['price_max'] = query.priceMax;
  if (query.categoryId !== undefined) params['categoryId'] = query.categoryId;
  if (query.categorySlug) params['categorySlug'] = query.categorySlug;

  if (query.pagination) {
    params['offset'] = query.pagination.offset;
    params['limit'] = query.pagination.limit;
  }

  return params;
}

/**
 * Data access for the products endpoints of the Platzi Fake Store API.
 *
 * Reads are exposed as `httpResource` factories so callers get loading, error
 * and value signals that re-fetch when their inputs change. Writes return cold
 * observables and must be subscribed to.
 *
 * Failures from the observable methods arrive as {@link ApiError}. Resources
 * expose the raw `HttpErrorResponse` on `error()`; pass it through
 * `toApiError` before rendering.
 */
@Service()
export class ProductApi {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);
  private readonly baseUrl = `${environment.apiBaseUrl}/products`;

  // --- Reactive reads -------------------------------------------------------

  /**
   * A live, filtered page of products.
   *
   * Re-fetches whenever any signal read inside `query` changes, cancelling the
   * request in flight.
   */
  productsResource(query: () => ProductQuery): HttpResourceRef<Product[]> {
    return httpResource<Product[]>(() => ({ url: this.baseUrl, params: toQueryParams(query()) }), {
      defaultValue: [],
      injector: this.injector,
      debugName: 'products',
    });
  }

  /**
   * A single product looked up by slug.
   *
   * Prefer this over {@link productResource}: the shared database is reseeded
   * daily, so numeric ids are not stable across days while slugs are readable
   * and survive as long as the record does. The request is skipped while
   * `slug` returns `undefined`.
   */
  productBySlugResource(slug: () => string | undefined): HttpResourceRef<Product | undefined> {
    return httpResource<Product>(
      () => {
        const value = slug();
        return value ? { url: `${this.baseUrl}/slug/${value}` } : undefined;
      },
      { injector: this.injector, debugName: 'productBySlug' },
    );
  }

  /** A single product looked up by id. Skipped while `id` returns `undefined`. */
  productResource(id: () => number | undefined): HttpResourceRef<Product | undefined> {
    return httpResource<Product>(
      () => {
        const value = id();
        return value === undefined ? undefined : { url: `${this.baseUrl}/${value}` };
      },
      { injector: this.injector, debugName: 'product' },
    );
  }

  /** Products related to the given slug, for a "you may also like" rail. */
  relatedProductsResource(slug: () => string | undefined): HttpResourceRef<Product[]> {
    return httpResource<Product[]>(
      () => {
        const value = slug();
        return value ? { url: `${this.baseUrl}/slug/${value}/related` } : undefined;
      },
      { defaultValue: [], injector: this.injector, debugName: 'relatedProducts' },
    );
  }

  // --- One-shot reads -------------------------------------------------------

  /** Fetches a filtered page once. Use in resolvers and guards. */
  getProducts(query: ProductQuery = {}): Observable<Product[]> {
    return this.http
      .get<Product[]>(this.baseUrl, { params: toQueryParams(query) })
      .pipe(catchError(this.fail));
  }

  /** Fetches one product by slug once. */
  getProductBySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/slug/${slug}`).pipe(catchError(this.fail));
  }

  /**
   * Counts the products matching `filters`.
   *
   * The API sends no total-count header and no pagination envelope, so the only
   * way to size a paginator is to request the unpaginated collection and measure
   * it. That transfers every matching record, so call it once per filter change
   * rather than once per page.
   */
  countProducts(filters: ProductFilters = {}): Observable<number> {
    return this.http.get<Product[]>(this.baseUrl, { params: toQueryParams(filters) }).pipe(
      map((products) => products.length),
      catchError(this.fail),
    );
  }

  // --- Writes ---------------------------------------------------------------

  /**
   * Creates a product.
   *
   * The endpoint is unauthenticated and writes land in a database shared with
   * every other user of the API, so treat anything created here as disposable.
   */
  createProduct(payload: CreateProduct): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, payload).pipe(catchError(this.fail));
  }

  /** Updates a product. Only the supplied fields change. */
  updateProduct(id: number, changes: UpdateProduct): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, changes).pipe(catchError(this.fail));
  }

  /** Deletes a product. Resolves to `true` when the record was removed. */
  deleteProduct(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.baseUrl}/${id}`).pipe(catchError(this.fail));
  }

  private readonly fail = (error: unknown): Observable<never> =>
    throwError(() => toApiError(error));
}

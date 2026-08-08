import { HttpClient, HttpResourceRef, httpResource } from '@angular/common/http';
import { Injector, Service, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Category, CreateCategory, Product, UpdateCategory, toApiError } from '../models';

/**
 * Data access for the categories endpoints.
 *
 * Note that `GET /categories` returns everything, including the hundreds of
 * empty test records other users have created in the shared database. The
 * storefront does not use this list: it derives its category filter from the
 * products actually returned, which excludes the junk without guesswork. These
 * methods back the admin screens, where seeing the real data matters.
 */
@Service()
export class CategoryApi {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);
  private readonly baseUrl = `${environment.apiBaseUrl}/categories`;

  /** Every category, unfiltered. */
  categoriesResource(): HttpResourceRef<Category[]> {
    return httpResource<Category[]>(() => ({ url: this.baseUrl }), {
      defaultValue: [],
      injector: this.injector,
      debugName: 'categories',
    });
  }

  /** A single category by slug. Skipped while `slug` returns `undefined`. */
  categoryBySlugResource(slug: () => string | undefined): HttpResourceRef<Category | undefined> {
    return httpResource<Category>(
      () => {
        const value = slug();
        return value ? { url: `${this.baseUrl}/slug/${value}` } : undefined;
      },
      { injector: this.injector, debugName: 'categoryBySlug' },
    );
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.baseUrl).pipe(catchError(this.fail));
  }

  /** Products belonging to a category, via the nested endpoint. */
  getCategoryProducts(id: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/${id}/products`).pipe(catchError(this.fail));
  }

  createCategory(payload: CreateCategory): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, payload).pipe(catchError(this.fail));
  }

  updateCategory(id: number, changes: UpdateCategory): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/${id}`, changes).pipe(catchError(this.fail));
  }

  deleteCategory(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.baseUrl}/${id}`).pipe(catchError(this.fail));
  }

  private readonly fail = (error: unknown): Observable<never> =>
    throwError(() => toApiError(error));
}

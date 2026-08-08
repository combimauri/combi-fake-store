/**
 * Query parameters accepted by `GET /products`.
 *
 * All fields are optional and combine with AND semantics. `title` is a
 * case-insensitive partial match.
 */
export interface ProductFilters {
  title?: string;
  price?: number;
  priceMin?: number;
  priceMax?: number;
  categoryId?: number;
  categorySlug?: string;
}

/**
 * Zero-based pagination window.
 *
 * Both fields are required together: the API silently ignores `limit` unless
 * `offset` is also present, returning the entire collection instead.
 */
export interface Pagination {
  offset: number;
  limit: number;
}

/** A filtered, paginated product query. */
export interface ProductQuery extends ProductFilters {
  pagination?: Pagination;
}

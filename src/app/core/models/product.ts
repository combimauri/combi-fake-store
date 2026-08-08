import { Category } from './category';

/** A product as returned by the Platzi Fake Store API. */
export interface Product {
  readonly id: number;
  readonly title: string;
  readonly slug: string;
  readonly price: number;
  readonly description: string;
  /** Absolute image URLs. The API guarantees at least one on create, but
   * user-created records in the shared database can still carry junk values,
   * so treat entries as untrusted when rendering. */
  readonly images: readonly string[];
  readonly category: Category;
  readonly creationAt: string;
  readonly updatedAt: string;
}

/**
 * Body accepted by `POST /products`.
 *
 * Note the asymmetry with `Product`: writes take a flat `categoryId`, while
 * reads return a nested `category` object.
 */
export interface CreateProduct {
  title: string;
  price: number;
  description: string;
  categoryId: number;
  /** Must contain at least one valid absolute URL or the API returns 400. */
  images: string[];
}

/** Body accepted by `PUT /products/:id`. Every field is optional. */
export type UpdateProduct = Partial<CreateProduct>;

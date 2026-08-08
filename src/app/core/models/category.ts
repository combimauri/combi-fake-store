/** A product category as returned by the Platzi Fake Store API. */
export interface Category {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly image: string;
  readonly creationAt: string;
  readonly updatedAt: string;
}

/** Body accepted by `POST /categories`. */
export interface CreateCategory {
  name: string;
  image: string;
}

/** Body accepted by `PUT /categories/:id`. Every field is optional. */
export type UpdateCategory = Partial<CreateCategory>;

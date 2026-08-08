import { Product } from './product';

/**
 * One line in the cart.
 *
 * The whole product is stored rather than just an id: the API has no cart
 * endpoint and reseeds daily, so a persisted cart holding only ids would break
 * the moment those ids disappear. Keeping the snapshot means the cart still
 * renders even after the source record is gone.
 */
export interface CartLine {
  readonly product: Product;
  readonly quantity: number;
}

/** Money totals derived from the cart contents. */
export interface CartTotals {
  readonly subtotal: number;
  readonly shipping: number;
  readonly tax: number;
  readonly total: number;
  readonly itemCount: number;
}

/** A placed order. Simulated locally, since the API has no orders endpoint. */
export interface Order {
  readonly reference: string;
  readonly placedAt: string;
  readonly lines: readonly CartLine[];
  readonly totals: CartTotals;
  readonly shipping: ShippingDetails;
}

/** Delivery details captured at checkout. */
export interface ShippingDetails {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

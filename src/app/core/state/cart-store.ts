import { Service, computed, signal } from '@angular/core';

import { CartLine, CartTotals, Product } from '../models';
import { createStorage } from './browser-storage';

/** Free delivery above this subtotal. */
const FREE_SHIPPING_THRESHOLD = 150;
const SHIPPING_FLAT_RATE = 9.9;
const TAX_RATE = 0.08;
/** Guards against a stepper being held down or a hand-edited storage payload. */
const MAX_QUANTITY_PER_LINE = 99;

/**
 * The shopping cart.
 *
 * Entirely client-side: the API has no cart, order, or inventory endpoints, so
 * this is the source of truth and `localStorage` is its durability. Totals are
 * derived rather than stored, so they can never drift from the lines.
 */
@Service()
export class CartStore {
  private readonly storage = createStorage('cart');
  private readonly lines = signal<readonly CartLine[]>(
    this.storage.read<CartLine[]>('lines') ?? [],
  );

  readonly items = this.lines.asReadonly();
  readonly isEmpty = computed(() => this.lines().length === 0);

  /** Total units across all lines, for the header badge. */
  readonly itemCount = computed(() => this.lines().reduce((sum, line) => sum + line.quantity, 0));

  readonly totals = computed<CartTotals>(() => {
    const subtotal = this.lines().reduce(
      (sum, line) => sum + line.product.price * line.quantity,
      0,
    );
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
    const tax = round(subtotal * TAX_RATE);

    return {
      subtotal: round(subtotal),
      shipping,
      tax,
      total: round(subtotal + shipping + tax),
      itemCount: this.itemCount(),
    };
  });

  /** How much more the shopper must spend to earn free delivery. */
  readonly amountToFreeShipping = computed(() => {
    const remaining = FREE_SHIPPING_THRESHOLD - this.totals().subtotal;
    return remaining > 0 ? round(remaining) : 0;
  });

  readonly freeShippingThreshold = FREE_SHIPPING_THRESHOLD;

  /** Adds a product, merging into the existing line when already present. */
  add(product: Product, quantity = 1): void {
    this.commit((lines) => {
      const existing = lines.find((line) => line.product.id === product.id);
      if (!existing) {
        return [...lines, { product, quantity: clampQuantity(quantity) }];
      }

      return lines.map((line) =>
        line.product.id === product.id
          ? {
              // Refresh the snapshot so price and title track the catalog.
              product,
              quantity: clampQuantity(line.quantity + quantity),
            }
          : line,
      );
    });
  }

  /** Sets an absolute quantity. Dropping to zero removes the line. */
  setQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.remove(productId);
      return;
    }

    this.commit((lines) =>
      lines.map((line) =>
        line.product.id === productId ? { ...line, quantity: clampQuantity(quantity) } : line,
      ),
    );
  }

  remove(productId: number): void {
    this.commit((lines) => lines.filter((line) => line.product.id !== productId));
  }

  clear(): void {
    this.commit(() => []);
  }

  /** Units of one product currently in the cart. */
  quantityOf(productId: number): number {
    return this.lines().find((line) => line.product.id === productId)?.quantity ?? 0;
  }

  /**
   * Applies a change and persists it in the same tick.
   *
   * Writing here rather than from an `effect` keeps persistence independent of
   * change detection, so a mutation immediately before the tab closes is still
   * durable. Storage writes are a no-op during SSR.
   */
  private commit(change: (lines: readonly CartLine[]) => readonly CartLine[]): void {
    const next = change(this.lines());
    this.lines.set(next);
    this.storage.write('lines', next);
  }
}

function clampQuantity(quantity: number): number {
  return Math.min(Math.max(Math.round(quantity), 1), MAX_QUANTITY_PER_LINE);
}

/** Rounds to cents, avoiding floating-point drift in displayed totals. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

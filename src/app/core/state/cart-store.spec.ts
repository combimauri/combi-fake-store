import { TestBed } from '@angular/core/testing';

import { Product } from '../models';
import { CartStore } from './cart-store';

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    title: 'Classic Red Jogger Sweatpants',
    slug: 'classic-red-jogger-sweatpants',
    price: 100,
    description: 'Soft joggers.',
    images: ['https://placehold.co/600x400'],
    category: {
      id: 1,
      name: 'Clothes',
      slug: 'clothes',
      image: 'https://placehold.co/600x400',
      creationAt: '2026-08-08T01:41:43.000Z',
      updatedAt: '2026-08-08T01:41:43.000Z',
    },
    creationAt: '2026-08-08T01:41:43.000Z',
    updatedAt: '2026-08-08T01:41:43.000Z',
    ...overrides,
  };
}

describe('CartStore', () => {
  let cart: CartStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    cart = TestBed.inject(CartStore);
  });

  it('merges a repeat add into the existing line instead of duplicating it', () => {
    cart.add(product());
    cart.add(product(), 2);

    expect(cart.items().length).toBe(1);
    expect(cart.itemCount()).toBe(3);
  });

  it('refreshes the stored snapshot so a repeat add tracks the current price', () => {
    cart.add(product({ price: 100 }));
    cart.add(product({ price: 80 }));

    expect(cart.items()[0].product.price).toBe(80);
  });

  it('removes the line when quantity drops to zero', () => {
    cart.add(product());
    cart.setQuantity(1, 0);

    expect(cart.isEmpty()).toBe(true);
  });

  it('charges flat-rate delivery below the free-shipping threshold', () => {
    cart.add(product({ price: 50 }));

    const totals = cart.totals();
    expect(totals.subtotal).toBe(50);
    expect(totals.shipping).toBe(9.9);
    expect(totals.tax).toBe(4);
    expect(totals.total).toBe(63.9);
    expect(cart.amountToFreeShipping()).toBe(100);
  });

  it('waives delivery once the threshold is reached', () => {
    cart.add(product({ price: 150 }));

    expect(cart.totals().shipping).toBe(0);
    expect(cart.amountToFreeShipping()).toBe(0);
  });

  it('clamps quantities to the per-line maximum', () => {
    cart.add(product(), 500);

    expect(cart.items()[0].quantity).toBe(99);
  });

  it('restores its contents from storage in a fresh injector', () => {
    cart.add(product(), 2);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const revived = TestBed.inject(CartStore);

    expect(revived.itemCount()).toBe(2);
    expect(revived.items()[0].product.slug).toBe('classic-red-jogger-sweatpants');
  });
});

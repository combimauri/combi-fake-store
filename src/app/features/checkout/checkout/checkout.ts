import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormField, email, form, minLength, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';

import { Order } from '../../../core/models';
import { CartStore } from '../../../core/state/cart-store';
import { SessionStore } from '../../../core/state/session-store';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Icon } from '../../../shared/ui/icon/icon';
import { SafeImage } from '../../../shared/ui/safe-image/safe-image';

/**
 * Checkout.
 *
 * The API has no orders or payments endpoint, so placing an order is simulated:
 * the cart is snapshotted into an {@link Order}, shown as a confirmation, and
 * the cart is emptied. Nothing is ever charged and no card details are asked
 * for, which is also why there is no payment step.
 */
@Component({
  selector: 'combi-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, EmptyState, FormField, Icon, RouterLink, SafeImage],
  templateUrl: './checkout.html',
})
export class Checkout {
  protected readonly cart = inject(CartStore);
  private readonly session = inject(SessionStore);

  protected readonly placing = signal(false);
  protected readonly placedOrder = signal<Order | undefined>(undefined);

  protected readonly model = signal({
    fullName: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'United States',
  });

  protected readonly checkoutForm = form(this.model, (path) => {
    required(path.fullName, { message: 'Enter the name for the delivery.' });
    minLength(path.fullName, 2, { message: 'That name looks too short.' });

    required(path.email, { message: 'We need an email to send the receipt.' });
    email(path.email, { message: 'Enter a valid email address.' });

    required(path.address, { message: 'Enter a street address.' });
    required(path.city, { message: 'Enter a city.' });
    required(path.postalCode, { message: 'Enter a postal code.' });
    required(path.country, { message: 'Choose a country.' });
  });

  protected readonly canSubmit = computed(() => !this.cart.isEmpty() && !this.placing());

  constructor() {
    // Prefill from the signed-in profile, but only while the field is untouched
    // so it never overwrites something the shopper typed.
    effect(() => {
      const user = this.session.user();
      if (!user) return;

      this.model.update((current) => ({
        ...current,
        fullName: current.fullName || user.name,
        email: current.email || user.email,
      }));
    });
  }

  protected placeOrder(): void {
    submit(this.checkoutForm, async () => {
      if (this.cart.isEmpty()) return;

      this.placing.set(true);
      // Stand-in for a payment round trip so the button's busy state is real.
      await new Promise((resolve) => setTimeout(resolve, 700));

      const order: Order = {
        reference: buildReference(),
        placedAt: new Date().toISOString(),
        lines: this.cart.items(),
        totals: this.cart.totals(),
        shipping: this.model(),
      };

      this.placedOrder.set(order);
      this.cart.clear();
      this.placing.set(false);

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}

/** Human-readable order reference, e.g. `FS-4K2H9Q`. */
function buildReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `FS-${suffix}`;
}

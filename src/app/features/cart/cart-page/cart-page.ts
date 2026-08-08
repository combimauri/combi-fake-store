import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartStore } from '../../../core/state/cart-store';
import { ToastStore } from '../../../core/state/toast-store';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Icon } from '../../../shared/ui/icon/icon';
import { QuantityStepper } from '../../../shared/ui/quantity-stepper/quantity-stepper';
import { SafeImage } from '../../../shared/ui/safe-image/safe-image';

@Component({
  selector: 'combi-cart-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, EmptyState, Icon, QuantityStepper, RouterLink, SafeImage],
  templateUrl: './cart-page.html',
})
export class CartPage {
  protected readonly cart = inject(CartStore);
  private readonly toasts = inject(ToastStore);

  protected remove(productId: number, title: string): void {
    this.cart.remove(productId);
    this.toasts.info(`${title} removed from your cart.`);
  }

  protected clear(): void {
    this.cart.clear();
    this.toasts.info('Your cart is empty.');
  }
}

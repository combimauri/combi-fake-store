import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiError, Product } from '../../../core/models';
import { ProductApi } from '../../../core/services/product-api';
import { ToastStore } from '../../../core/state/toast-store';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Icon } from '../../../shared/ui/icon/icon';
import { SafeImage } from '../../../shared/ui/safe-image/safe-image';

@Component({
  selector: 'combi-admin-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConfirmDialog, CurrencyPipe, EmptyState, Icon, RouterLink, SafeImage],
  templateUrl: './admin-products.html',
})
export class AdminProducts {
  private readonly productApi = inject(ProductApi);
  private readonly toasts = inject(ToastStore);

  protected readonly search = signal('');
  protected readonly products = this.productApi.productsResource(() => ({}));

  protected readonly pendingDelete = signal<Product | undefined>(undefined);
  protected readonly deleting = signal(false);

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const all = this.products.value();
    if (!term) return all;

    return all.filter(
      (product) =>
        product.title.toLowerCase().includes(term) ||
        product.category.name.toLowerCase().includes(term),
    );
  });

  protected async confirmDelete(): Promise<void> {
    const product = this.pendingDelete();
    if (!product) return;

    this.deleting.set(true);
    try {
      await firstValueFrom(this.productApi.deleteProduct(product.id));
      this.toasts.success(`"${product.title}" was deleted.`);
      this.pendingDelete.set(undefined);
      this.products.reload();
    } catch (error) {
      this.toasts.error((error as ApiError).message);
    } finally {
      this.deleting.set(false);
    }
  }
}

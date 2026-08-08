import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, form, minLength, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

import { ApiError, Category } from '../../../core/models';
import { CategoryApi } from '../../../core/services/category-api';
import { ToastStore } from '../../../core/state/toast-store';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { Icon } from '../../../shared/ui/icon/icon';
import { SafeImage } from '../../../shared/ui/safe-image/safe-image';

@Component({
  selector: 'combi-admin-categories',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConfirmDialog, FormField, Icon, SafeImage],
  templateUrl: './admin-categories.html',
})
export class AdminCategories {
  private readonly categoryApi = inject(CategoryApi);
  private readonly toasts = inject(ToastStore);

  protected readonly categories = this.categoryApi.categoriesResource();

  protected readonly busy = signal(false);
  protected readonly deleting = signal(false);
  protected readonly editing = signal<Category | undefined>(undefined);
  protected readonly pendingDelete = signal<Category | undefined>(undefined);

  protected readonly model = signal({
    name: '',
    image: 'https://placehold.co/600x400',
  });

  protected readonly categoryForm = form(this.model, (path) => {
    required(path.name, { message: 'Name the category.' });
    minLength(path.name, 3, { message: 'Use at least 3 characters.' });
    required(path.image, { message: 'An image URL is required.' });
  });

  protected startEdit(category: Category): void {
    this.editing.set(category);
    this.model.set({ name: category.name, image: category.image });
  }

  protected cancelEdit(): void {
    this.editing.set(undefined);
    this.model.set({ name: '', image: 'https://placehold.co/600x400' });
  }

  protected save(): void {
    submit(this.categoryForm, async () => {
      this.busy.set(true);

      try {
        const target = this.editing();
        if (target) {
          await firstValueFrom(this.categoryApi.updateCategory(target.id, this.model()));
          this.toasts.success('Category updated.');
        } else {
          await firstValueFrom(this.categoryApi.createCategory(this.model()));
          this.toasts.success('Category created.');
        }

        this.cancelEdit();
        this.categories.reload();
      } catch (error) {
        const apiError = error as ApiError;
        this.toasts.error(apiError.details.length > 0 ? apiError.details[0] : apiError.message);
      } finally {
        this.busy.set(false);
      }
    });
  }

  protected async confirmDelete(): Promise<void> {
    const category = this.pendingDelete();
    if (!category) return;

    this.deleting.set(true);
    try {
      await firstValueFrom(this.categoryApi.deleteCategory(category.id));
      this.toasts.success(`"${category.name}" was deleted.`);
      this.pendingDelete.set(undefined);
      this.categories.reload();
    } catch (error) {
      this.toasts.error((error as ApiError).message);
    } finally {
      this.deleting.set(false);
    }
  }
}

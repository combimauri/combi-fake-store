import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormField,
  form,
  min,
  minLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiError, CreateProduct } from '../../../core/models';
import { CategoryApi } from '../../../core/services/category-api';
import { FileApi } from '../../../core/services/file-api';
import { ProductApi } from '../../../core/services/product-api';
import { ToastStore } from '../../../core/state/toast-store';
import { Icon } from '../../../shared/ui/icon/icon';
import { SafeImage } from '../../../shared/ui/safe-image/safe-image';

/**
 * Create/edit form for a product.
 *
 * One component serves both routes: presence of an `:id` param switches it to
 * edit mode and loads the record.
 */
@Component({
  selector: 'combi-product-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Icon, RouterLink, SafeImage],
  templateUrl: './product-form.html',
})
export class ProductForm {
  private readonly productApi = inject(ProductApi);
  private readonly categoryApi = inject(CategoryApi);
  private readonly fileApi = inject(FileApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toasts = inject(ToastStore);

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });

  protected readonly productId = computed(() => {
    const raw = this.params().get('id');
    return raw === null ? undefined : Number(raw);
  });
  protected readonly isEdit = computed(() => this.productId() !== undefined);

  protected readonly existing = this.productApi.productResource(this.productId);
  protected readonly categories = this.categoryApi.categoriesResource();

  protected readonly busy = signal(false);
  protected readonly uploading = signal(false);
  protected readonly failure = signal<string | undefined>(undefined);
  protected readonly details = signal<readonly string[]>([]);

  protected readonly model = signal({
    title: '',
    price: 0,
    description: '',
    // Held as a string because `<select>` option values are strings; converted
    // back to a number when building the request body.
    categoryId: '',
    images: [] as string[],
    imageDraft: '',
  });

  protected readonly productForm = form(this.model, (path) => {
    required(path.title, { message: 'Give the product a title.' });
    minLength(path.title, 3, { message: 'Use at least 3 characters.' });

    required(path.price, { message: 'Set a price.' });
    min(path.price, 1, { message: 'The API rejects prices below 1.' });

    required(path.description, { message: 'Add a description.' });
    minLength(path.description, 10, {
      message: 'Describe the product in at least 10 characters.',
    });

    required(path.categoryId, { message: 'Choose a category.' });
    validate(path.categoryId, ({ value }) =>
      Number(value()) > 0 ? undefined : { kind: 'category', message: 'Choose a category.' },
    );
  });

  /** The API requires at least one image URL, so this is enforced separately. */
  protected readonly hasImages = computed(() => this.model().images.length > 0);

  constructor() {
    // Fill the form once the record for an edit route arrives.
    effect(() => {
      const product = this.existing.value();
      if (!product) return;

      this.model.set({
        title: product.title,
        price: product.price,
        description: product.description,
        categoryId: String(product.category.id),
        images: [...product.images],
        imageDraft: '',
      });
    });

    // Default the category select to the first real option on create.
    effect(() => {
      const options = this.categories.value();
      if (this.isEdit() || options.length === 0) return;
      if (this.model().categoryId !== '') return;

      this.model.update((current) => ({
        ...current,
        categoryId: String(options[0].id),
      }));
    });
  }

  protected addImageUrl(): void {
    const url = this.model().imageDraft.trim();
    if (!/^https?:\/\//i.test(url)) {
      this.toasts.error('Enter an absolute http(s) image URL.');
      return;
    }

    this.model.update((current) => ({
      ...current,
      images: [...current.images, url],
      imageDraft: '',
    }));
  }

  protected removeImage(index: number): void {
    this.model.update((current) => ({
      ...current,
      images: current.images.filter((_, i) => i !== index),
    }));
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    try {
      const url = await firstValueFrom(this.fileApi.upload(file));
      this.model.update((current) => ({
        ...current,
        images: [...current.images, url],
      }));
      this.toasts.success('Image uploaded.');
    } catch (error) {
      this.toasts.error((error as ApiError).message);
    } finally {
      this.uploading.set(false);
      // Reset so re-picking the same file fires `change` again.
      input.value = '';
    }
  }

  protected save(): void {
    submit(this.productForm, async () => {
      if (!this.hasImages()) {
        this.failure.set('Add at least one image before saving.');
        return;
      }

      this.busy.set(true);
      this.failure.set(undefined);
      this.details.set([]);

      const { title, price, description, categoryId, images } = this.model();
      const payload: CreateProduct = {
        title,
        price: Number(price),
        description,
        categoryId: Number(categoryId),
        images,
      };

      try {
        const id = this.productId();
        if (id === undefined) {
          await firstValueFrom(this.productApi.createProduct(payload));
          this.toasts.success('Product created.');
        } else {
          await firstValueFrom(this.productApi.updateProduct(id, payload));
          this.toasts.success('Product updated.');
        }
        await this.router.navigateByUrl('/admin/products');
      } catch (error) {
        const apiError = error as ApiError;
        this.failure.set(apiError.message);
        // Field-level messages from the API render as a list beneath the banner.
        this.details.set(apiError.details);
      } finally {
        this.busy.set(false);
      }
    });
  }
}

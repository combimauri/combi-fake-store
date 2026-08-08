import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { Icon } from '../../../shared/ui/icon/icon';
import { CategoryFacet } from '../catalog/catalog';

/** How many categories to show before the "show all" toggle. */
const VISIBLE_LIMIT = 8;

/** Presentational filter controls for the catalog. */
@Component({
  selector: 'combi-filter-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './filter-panel.html',
})
export class FilterPanel {
  readonly categories = input.required<readonly CategoryFacet[]>();
  readonly loading = input(false);
  readonly activeCategory = input<string | undefined>(undefined);
  readonly minPrice = input<number | undefined>(undefined);
  readonly maxPrice = input<number | undefined>(undefined);
  readonly hasActiveFilters = input(false);

  readonly categoryChange = output<string | undefined>();
  readonly priceChange = output<{ min?: number; max?: number }>();
  readonly clear = output<void>();

  protected readonly expanded = signal(false);

  protected readonly visible = computed(() =>
    this.expanded() ? this.categories() : this.categories().slice(0, VISIBLE_LIMIT),
  );

  protected readonly hiddenCount = computed(() =>
    Math.max(0, this.categories().length - VISIBLE_LIMIT),
  );

  protected onMin(value: string): void {
    this.priceChange.emit({
      min: value === '' ? undefined : Number(value),
      max: this.maxPrice(),
    });
  }

  protected onMax(value: string): void {
    this.priceChange.emit({
      min: this.minPrice(),
      max: value === '' ? undefined : Number(value),
    });
  }
}

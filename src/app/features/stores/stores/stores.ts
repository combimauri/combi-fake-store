import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { LocationQuery, StoreLocation } from '../../../core/models';
import { LocationApi } from '../../../core/services/location-api';
import { ToastStore } from '../../../core/state/toast-store';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Icon } from '../../../shared/ui/icon/icon';

/** Medellín, the origin the API's own examples use. */
const DEFAULT_ORIGIN = '6.2071641,-75.5720321';

@Component({
  selector: 'combi-stores',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, Icon],
  templateUrl: './stores.html',
})
export class Stores {
  private readonly locationApi = inject(LocationApi);
  private readonly toasts = inject(ToastStore);

  protected readonly origin = signal(DEFAULT_ORIGIN);
  protected readonly radius = signal<number | undefined>(undefined);
  protected readonly locating = signal(false);
  protected readonly usingMyLocation = signal(false);

  private readonly query = computed<LocationQuery>(() => ({
    origin: this.origin(),
    size: 12,
    radius: this.radius(),
  }));

  protected readonly locations = this.locationApi.locationsResource(this.query);

  protected readonly hasResults = computed(() => this.locations.value().length > 0);

  /** Asks the browser for coordinates and re-sorts the list around them. */
  protected useMyLocation(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.toasts.error('Your browser cannot share a location.');
      return;
    }

    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.origin.set(`${latitude},${longitude}`);
        this.usingMyLocation.set(true);
        this.locating.set(false);
      },
      () => {
        this.locating.set(false);
        this.toasts.error('We could not read your location.');
      },
      { timeout: 8000 },
    );
  }

  protected resetOrigin(): void {
    this.origin.set(DEFAULT_ORIGIN);
    this.usingMyLocation.set(false);
  }

  protected toggleRadius(): void {
    this.radius.update((value) => (value === undefined ? 10 : undefined));
  }

  protected mapLink(location: StoreLocation): string {
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  }
}

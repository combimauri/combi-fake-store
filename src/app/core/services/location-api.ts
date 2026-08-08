import { HttpResourceRef, httpResource } from '@angular/common/http';
import { Injector, Service, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { LocationQuery, StoreLocation } from '../models';

/** Data access for the store-locator endpoint. */
@Service()
export class LocationApi {
  private readonly injector = inject(Injector);
  private readonly baseUrl = `${environment.apiBaseUrl}/locations`;

  /**
   * Store locations, optionally sorted by distance from an origin.
   *
   * With no `origin` the endpoint returns ten random locations.
   */
  locationsResource(query: () => LocationQuery): HttpResourceRef<StoreLocation[]> {
    return httpResource<StoreLocation[]>(
      () => {
        const { origin, size, radius } = query();
        const params: Record<string, string | number> = {};
        if (origin) params['origin'] = origin;
        if (size !== undefined) params['size'] = size;
        if (radius !== undefined) params['radius'] = radius;
        return { url: this.baseUrl, params };
      },
      { defaultValue: [], injector: this.injector, debugName: 'locations' },
    );
  }
}

/** A physical store location. */
export interface StoreLocation {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly latitude: number;
  readonly longitude: number;
}

/** Query parameters accepted by `GET /locations`. */
export interface LocationQuery {
  /** `lat,lng` origin used to sort results by distance. */
  origin?: string;
  /** Maximum number of results. */
  size?: number;
  /** Radius in kilometres around `origin`. */
  radius?: number;
}

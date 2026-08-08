/** Credentials accepted by `POST /auth/login`. */
export interface Credentials {
  email: string;
  password: string;
}

/**
 * Token pair returned by login and refresh.
 *
 * Field names are snake_case on the wire. The access token lasts 20 days and
 * the refresh token 10 hours, so the refresh token expires first.
 */
export interface AuthTokens {
  readonly access_token: string;
  readonly refresh_token: string;
}

/** Response of `POST /users/is-available`. */
export interface EmailAvailability {
  readonly isAvailable: boolean;
}

import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthTokens, Credentials, User, toApiError } from '../models';

/** JWT authentication against `/auth`. */
@Service()
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  /** Exchanges credentials for an access/refresh token pair. */
  login(credentials: Credentials): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(`${this.baseUrl}/login`, credentials)
      .pipe(catchError(this.fail));
  }

  /**
   * Reads the profile of the bearer of the current access token.
   *
   * The token is attached by `authInterceptor`, so no header is set here.
   */
  profile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/profile`).pipe(catchError(this.fail));
  }

  /**
   * Trades a refresh token for a fresh pair.
   *
   * Note the casing flip: the request body uses `refreshToken` while the
   * response uses `refresh_token`.
   */
  refresh(refreshToken: string): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(`${this.baseUrl}/refresh-token`, { refreshToken })
      .pipe(catchError(this.fail));
  }

  private readonly fail = (error: unknown): Observable<never> =>
    throwError(() => toApiError(error));
}

import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { TokenStore } from '../state/token-store';

/**
 * Attaches the bearer token to API calls.
 *
 * Reads from `TokenStore` rather than `SessionStore` so the interceptor never
 * pulls `HttpClient` back into its own construction. The URL check keeps the
 * token off any third-party request, and the login and refresh endpoints are
 * skipped because sending a stale token there can only cause a rejection.
 */
export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const isApiCall = req.url.startsWith(environment.apiBaseUrl);
  const isAuthExchange = req.url.includes('/auth/login') || req.url.includes('/auth/refresh-token');

  if (!isApiCall || isAuthExchange) {
    return next(req);
  }

  const token = inject(TokenStore).accessToken();
  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
}

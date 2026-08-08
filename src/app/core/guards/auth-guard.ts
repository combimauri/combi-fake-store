import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionStore } from '../state/session-store';
import { ToastStore } from '../state/toast-store';

/**
 * Requires a signed-in user, sending anonymous visitors to the login page with
 * a `redirectTo` so they land back where they were headed.
 *
 * Every dependency is injected before the first `await`: `inject()` is only
 * legal inside the synchronous part of the guard.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const session = inject(SessionStore);
  const router = inject(Router);

  // On a cold load the profile is still in flight; without this a valid
  // session would be treated as anonymous and bounced to the login page.
  await session.whenReady();

  if (session.isAuthenticated()) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { redirectTo: state.url },
  });
};

/**
 * Requires an admin.
 *
 * Roles come from the API, and accounts created through this app are always
 * `customer`. Signed-in non-admins are told why rather than being bounced to a
 * login form they have already completed.
 */
export const adminGuard: CanActivateFn = async (route, state) => {
  const session = inject(SessionStore);
  const router = inject(Router);
  const toasts = inject(ToastStore);

  await session.whenReady();

  if (session.isAdmin()) return true;

  if (session.isAuthenticated()) {
    toasts.error('That area is restricted to admin accounts.');
    return router.createUrlTree(['/']);
  }

  return router.createUrlTree(['/login'], {
    queryParams: { redirectTo: state.url },
  });
};

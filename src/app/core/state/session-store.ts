import { Service, computed, inject, signal } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';

import { AuthTokens, Credentials, User } from '../models';
import { AuthApi } from '../services/auth-api';
import { TokenStore } from './token-store';

/** Where the session is in its lifecycle. */
export type SessionStatus = 'anonymous' | 'restoring' | 'authenticated';

/**
 * The signed-in user and the operations that change who that is.
 *
 * Sits on top of {@link TokenStore}: tokens are the persisted part, the profile
 * is re-fetched on boot because the API has no way to derive it from the token
 * offline.
 */
@Service()
export class SessionStore {
  private readonly authApi = inject(AuthApi);
  private readonly tokens = inject(TokenStore);

  private readonly currentUser = signal<User | undefined>(undefined);
  private readonly status = signal<SessionStatus>('anonymous');

  /**
   * Resolves once the boot-time restore has settled, either way.
   *
   * Route guards must await this. On a cold load of a guarded URL the guard
   * runs before the profile request comes back, and without this a perfectly
   * valid session would be bounced to the login page.
   */
  private readonly ready: Promise<void>;

  readonly user = this.currentUser.asReadonly();
  readonly state = this.status.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== undefined);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  /** True while a stored token is being exchanged for a profile on boot. */
  readonly isRestoring = computed(() => this.status() === 'restoring');

  constructor() {
    // Self-initializing, so `whenReady()` is meaningful no matter who injects
    // this first — a guard, the header, or the root component.
    this.ready = this.restore();
  }

  /** Awaited by guards; resolves when the session is known. */
  whenReady(): Promise<void> {
    return this.ready;
  }

  /** Authenticates, stores the tokens, and loads the profile. */
  signIn(credentials: Credentials): Observable<User> {
    return this.authApi.login(credentials).pipe(
      tap((tokens: AuthTokens) => this.tokens.set(tokens)),
      switchMap(() => this.authApi.profile()),
      tap({
        next: (user) => {
          this.currentUser.set(user);
          this.status.set('authenticated');
        },
        error: () => this.signOut(),
      }),
    );
  }

  /** Drops the profile and the stored tokens. */
  signOut(): void {
    this.currentUser.set(undefined);
    this.status.set('anonymous');
    this.tokens.clear();
  }

  /**
   * Rehydrates the session from a persisted token.
   *
   * A rejected token (expired, or wiped by the daily reseed) silently clears
   * the session rather than surfacing an error the shopper cannot act on.
   */
  private restore(): Promise<void> {
    if (!this.tokens.hasSession()) return Promise.resolve();

    this.status.set('restoring');

    return new Promise<void>((resolve) => {
      this.authApi.profile().subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.status.set('authenticated');
          resolve();
        },
        error: () => {
          this.signOut();
          resolve();
        },
      });
    });
  }
}

import { Service, computed, signal } from '@angular/core';

import { AuthTokens } from '../models';
import { createStorage } from './browser-storage';

/**
 * Holds the JWT pair and nothing else.
 *
 * Deliberately free of HTTP dependencies so `authInterceptor` can read the
 * access token without creating a dependency cycle through `HttpClient`.
 * Session behaviour that needs the network lives in `SessionStore`.
 */
@Service()
export class TokenStore {
  private readonly storage = createStorage('auth');
  private readonly tokens = signal<AuthTokens | undefined>(this.storage.read<AuthTokens>('tokens'));

  readonly accessToken = computed(() => this.tokens()?.access_token);
  readonly refreshToken = computed(() => this.tokens()?.refresh_token);
  readonly hasSession = computed(() => this.tokens() !== undefined);

  set(tokens: AuthTokens): void {
    this.tokens.set(tokens);
    this.storage.write('tokens', tokens);
  }

  clear(): void {
    this.tokens.set(undefined);
    this.storage.remove('tokens');
  }
}

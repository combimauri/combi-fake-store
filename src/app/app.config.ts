import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // Restore the previous scroll position on back, and jump to the top on
      // forward navigation.
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
      // Cross-fades route changes where the browser supports it; the CSS
      // reduced-motion block neutralises it for anyone who opts out.
      withViewTransitions(),
    ),
    provideClientHydration(),
    // Hydration enables the HTTP transfer cache by default, so products fetched
    // during SSR are reused on the client instead of being requested twice.
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};

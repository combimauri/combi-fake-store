import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Render modes per route.
 *
 * Only the catalogue shell and static pages can be prerendered. Product detail
 * cannot: slugs live in a database that is reseeded daily, so there is no
 * build-time list to enumerate and any prerendered page would be stale within
 * hours. Those routes render on demand instead.
 *
 * Routes that depend on `localStorage` (cart, checkout, account, admin) are
 * client-rendered, since their content is meaningless without the browser state
 * and server-rendering them would only flash an empty shell.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'products/:slug', renderMode: RenderMode.Server },
  { path: 'stores', renderMode: RenderMode.Server },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'register', renderMode: RenderMode.Prerender },
  { path: 'cart', renderMode: RenderMode.Client },
  { path: 'checkout', renderMode: RenderMode.Client },
  { path: 'account', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  // The catch-all serves the not-found page, so it must answer 404 rather than
  // 200. A soft-404 would let search engines index every mistyped URL.
  { path: '**', renderMode: RenderMode.Server, status: 404 },
];

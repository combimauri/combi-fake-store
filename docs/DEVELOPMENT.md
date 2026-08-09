# Development

Setup, conventions, and the recipes for common tasks.

---

## Requirements

| | |
| --- | --- |
| Node | `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0` — Angular 22's requirement. Built on 24.15. |
| npm | 8+ (built on 11.12) |
| Angular CLI | Provided by the repo — use `npx ng` |

```bash
npm install
npm start        # http://localhost:4200
```

No environment variables, keys, or local backend are needed. The app calls the public API
directly.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Dev server with SSR and hot reload |
| `npm run build` | Production build to `dist/fake-store` |
| `npm test` | Vitest, single run |
| `npm test -- --watch` | Vitest in watch mode |
| `npm run watch` | Rebuild on change, development configuration |
| `npm run serve:ssr:fake-store` | Run the built SSR server (see the caveat below) |
| `npx prettier --write "src/**/*.{ts,html,css}"` | Format |

### Configuration

`src/environments/environment.ts` (and `.development.ts`) hold the only configuration:

```ts
export const environment = {
  apiBaseUrl: 'https://api.escuelajs.co/api/v1',
};
```

Point this at a mock server to develop offline. Never put secrets here — environment files
are bundled into the client and are readable by anyone.

---

## Running the production server locally

`npm run serve:ssr:fake-store` starts the built Express server on `:4000`.

This works only because `localhost` is listed in `security.allowedHosts` (see
[Allowed hosts](#allowed-hosts) below). Angular 20+ rejects any request whose `Host` header
is not on that list, and the default is an empty list — meaning **everything** is rejected:

```
Bad Request: Header "host" with value "localhost:4000" is not allowed.
```

If you see that, the host is missing from the list. Ports are stripped before the check, so
`localhost` covers any port.

---

## Conventions

### Files and naming

The **2025 Angular style guide** is in force: no type suffixes in filenames.

| Kind | File | Class |
| --- | --- | --- |
| Component | `product-card.ts` | `ProductCard` |
| Service | `product-api.ts` | `ProductApi` |
| Store | `cart-store.ts` | `CartStore` |
| Model | `product.ts` | `Product` |

Selectors use the `combi` prefix: `<combi-product-card>`.

Generate with the CLI so the conventions are applied for you:

```bash
npx ng generate component features/wishlist/wishlist --skip-tests --inline-style
npx ng generate service core/services/wishlist-api --skip-tests
npx ng generate interface core/models/wishlist
```

Components with more than ~30 lines of template use `templateUrl`; smaller ones inline it.

### Angular usage

- **`@Service()`**, not `@Injectable({ providedIn: 'root' })` — v22's decorator for singletons.
- **`inject()`**, not constructor parameters.
- **`input()` / `output()`**, not `@Input` / `@Output`.
- **Signals for all state.** `computed` for anything derivable; `linkedSignal` for state that
  should reset when a source changes.
- **Native control flow** — `@if`, `@for`, `@switch`. Never `*ngIf` / `*ngFor`.
- **`class` and `style` bindings**, never `ngClass` / `ngStyle`.
- **Host bindings** go in the `host` object, not `@HostBinding` / `@HostListener`.
- **Never set `standalone: true`** (default) or `changeDetection: OnPush` (default in v22).

### TypeScript

`strict` is on. Avoid `any`; prefer `unknown` and narrow. API response types are assertions,
not guarantees — treat anything from the shared database as untrusted, especially image URLs.

### Signal Forms

All forms use `@angular/forms/signals`. The traps that cost the most time:

| Do | Not |
| --- | --- |
| `form.email().errors()` | `form.email.errors()` |
| `form().invalid()` | `form.invalid()` |
| `form.items.length` | `form.items().length` |
| `signal({ name: '' })` | `signal({ name: null })` |
| `submit(f, async () => …)` | `submit(f, () => …)` |
| `min()` rule in the schema | `min` attribute on the input |

`<select>` binds to **string** fields only. `ProductForm` keeps `categoryId` as a string and
converts with `Number()` when building the payload — binding a number field to a select is a
compile error.

---

## Recipes

### Add a new screen

1. **Generate it.**
   ```bash
   npx ng generate component features/wishlist/wishlist --skip-tests --inline-style
   ```
2. **Add the route** in `app.routes.ts`, lazily:
   ```ts
   {
     path: 'wishlist',
     title: 'Wishlist — FakeStore',
     loadComponent: () => import('./features/wishlist/wishlist/wishlist').then(m => m.Wishlist),
   }
   ```
3. **Choose a render mode** in `app.routes.server.ts`. If it depends on `localStorage` or a
   session, use `RenderMode.Client`.
4. **Build the three states** — loading skeleton, empty, and error with retry.
5. **Check** 375 px, dark mode, and keyboard navigation.

### Add an API endpoint

Add the method to the relevant client in `core/services/`, following the existing split:

```ts
// Read — reactive
wishlistResource(userId: () => number | undefined): HttpResourceRef<Product[]> {
  return httpResource<Product[]>(
    () => {
      const id = userId();
      return id === undefined ? undefined : { url: `${this.baseUrl}/${id}/wishlist` };
    },
    { defaultValue: [], injector: this.injector, debugName: 'wishlist' },
  );
}

// Write — cold observable, normalised errors
addToWishlist(userId: number, productId: number): Observable<Product> {
  return this.http
    .post<Product>(`${this.baseUrl}/${userId}/wishlist`, { productId })
    .pipe(catchError(this.fail));
}
```

Always pass `injector: this.injector` to resource factories, and always `catchError(this.fail)`
on observables so callers receive an `ApiError`.

### Add a store

```ts
@Service()
export class WishlistStore {
  private readonly storage = createStorage('wishlist');
  private readonly items = signal<readonly number[]>(
    this.storage.read<number[]>('items') ?? [],
  );

  readonly all = this.items.asReadonly();
  readonly count = computed(() => this.items().length);

  add(id: number): void {
    this.commit((items) => [...items, id]);
  }

  // Persist inside the mutation, never from an effect — see DECISIONS.md
  private commit(change: (items: readonly number[]) => readonly number[]): void {
    const next = change(this.items());
    this.items.set(next);
    this.storage.write('items', next);
  }
}
```

Use `createStorage()` for anything persisted; it is a no-op on the server, which keeps SSR
working.

### Add an icon

Copy the `d` attribute from a 24×24 [Lucide](https://lucide.dev) icon into the `PATHS` map in
`shared/ui/icon/icon.ts`. `IconName` updates automatically.

---

## Testing

Vitest with `@angular/core/testing`, in a zoneless setup.

```bash
npm test
npm test -- --watch
```

### Patterns

Use **Act → Wait → Assert**. Never `fixture.detectChanges()`.

```ts
component.title.set('New');
await fixture.whenStable();
expect(h1.textContent).toContain('New');
```

`TestBed.whenStable()` does **not** exist as a static — use `TestBed.tick()` for a
synchronous flush outside a fixture, or `fixture.whenStable()` with one.

HTTP is tested with `provideHttpClientTesting`:

```ts
TestBed.configureTestingModule({
  providers: [provideHttpClient(), provideHttpClientTesting()],
});

service.getProducts({ pagination: { offset: 20, limit: 10 } }).subscribe();

const req = httpTesting.expectOne((r) => r.url === BASE_URL);
expect(req.request.params.get('offset')).toBe('20');
req.flush([]);
```

For an `httpResource`, create it inside `TestBed.runInInjectionContext`, then drive it with
`TestBed.tick()`.

### What is covered

| File | Covers |
| --- | --- |
| `product-api.spec.ts` | Query-parameter construction (including the `limit`/`offset` pairing), error normalisation for all three envelopes, resource re-fetch on signal change |
| `cart-store.spec.ts` | Line merging, price refresh, quantity clamping, removal, money maths, storage round-trip |
| `app.spec.ts` | Shell renders skip link, header, footer, main |

The API quirks in [API.md](API.md) are deliberately encoded as tests, so a refactor that
"tidies away" the `limit`/`offset` pairing fails loudly.

---

## Deployment

```bash
npm run build
```

Produces:

```
dist/fake-store/
├── browser/     # static assets + prerendered routes
├── server/      # server.mjs — the SSR request handler
└── prerendered-routes.json
```

Any Node host works. Set `PORT` if `4000` is unsuitable.

### Allowed hosts

Angular 20+ validates the `Host`, `X-Forwarded-Host`, and `Forwarded` headers against
`security.allowedHosts` in `angular.json`, and **rejects everything by default**. This is
[SSRF protection](https://angular.dev/best-practices/security#preventing-server-side-request-forgery-ssrf),
not a bug.

```jsonc
// angular.json → projects.fake-store.architect.build.options
"security": { "allowedHosts": ["*.vercel.app", "localhost"] }
```

Three things to know:

- The value is **baked into the build** — it is compiled into
  `dist/fake-store/server/angular-app-engine-manifest.mjs`. A runtime environment variable
  will not change it; you must rebuild.
- `*.` prefixes match by suffix, so `*.vercel.app` covers both the production alias and every
  preview deployment.
- Prefer listing real hosts over `"*"`. Using `"*"` disables the protection entirely and logs
  a warning.

If you need per-environment control without rebuilding, `AngularNodeAppEngine` also accepts
hosts at runtime in `src/server.ts`, where they are merged with the compiled list:

```ts
new AngularNodeAppEngine({ allowedHosts: process.env['ALLOWED_HOSTS']?.split(',') });
```

### Vercel

The repo is configured for Vercel. Two files do the work:

| File | Role |
| --- | --- |
| `api/index.mjs` | Wraps the compiled `reqHandler` as a Vercel Function |
| `vercel.json` | Serves static assets, rewrites everything else to that function |

This wrapper is necessary because **Vercel's built-in Angular preset is static-only**. It
builds with `ng build`, serves `dist/<project>/browser`, and never invokes `server.mjs`. Its
fallback route points at `/index.html`, which does not exist when `outputMode` is `server` —
the build emits `index.csr.html` instead. Deployed with the preset alone, the app would not
server-render and `/` would 404.

Two details in `vercel.json` are load-bearing:

- **`includeFiles: "dist/fake-store/**"`** — without it the deploy succeeds and the function
  fails at runtime the moment it imports `server.mjs`.
- **An explicit `{ "source": "/", ... }` rewrite** in addition to the catch-all. Vercel checks
  the filesystem before applying rewrites, so the root needs its own rule to reach the
  function reliably.

To verify a deployment actually server-renders, ask for markup only the server could have
produced:

```bash
curl -s https://<deployment-url>/ | grep -c "Classic Red"
```

A non-zero count means SSR ran; zero means you received the client shell.

### Before going live elsewhere

1. Add your domain to `security.allowedHosts` and rebuild.
2. Point `environment.ts` at the intended API if it is not the public one.
3. Fonts load from Google Fonts — self-host them if your CSP forbids third-party origins.

---

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `Header "host" … is not allowed` | The host is missing from `security.allowedHosts` in `angular.json`. Add it and **rebuild** — the list is baked into the bundle. |
| Products vanish, IDs 404 | The daily reseed. Expected — never hardcode an ID. |
| `limit` returns everything | `offset` is missing. They must be sent together. |
| Empty categories in a filter | Something is calling `GET /categories` for the storefront. Derive facets from products instead. |
| A guarded route bounces on refresh | A guard is not awaiting `session.whenReady()`. |
| `Property 'value' does not exist on type 'FieldTree'` | Call the field first: `form.field().value()`. |
| `matchMedia is not a function` in tests | Guard browser APIs behind a platform and capability check, as `ThemeStore` does. |
| Dark mode ignores a colour | It was hardcoded instead of using a token, or `@theme` was used without `inline`. |

---

## Further reading

- [Architecture](ARCHITECTURE.md) — layers, data flow, state, SSR
- [Decisions](DECISIONS.md) — why things are the way they are
- [Upstream API](API.md) — endpoints and quirks
- [Design system](DESIGN-SYSTEM.md) — tokens, UI kit, accessibility
- [Features](FEATURES.md) — what each screen does
- `AGENTS.md` — Angular conventions for AI coding assistants

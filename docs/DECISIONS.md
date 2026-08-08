# Decisions

The non-obvious choices in this codebase, and why they were made. Most exist because the
upstream API behaves in a specific way — see [API.md](API.md) for the evidence behind each.

---

## The catalogue fetches once and pages client-side

**Decision.** `Catalog` requests the full filtered result set in a single call, then sorts,
pages, and applies the category filter in the browser.

**Why.** Three API limits push in the same direction:

1. **No total-count header.** Sizing a paginator already requires fetching the unpaginated
   list, so server-side paging would mean *two* requests per page — the page plus a count.
2. **No sort parameter.** Server-side paging could only ever sort within a page, which is
   simply wrong: page 2 of "cheapest first" would not contain the 13th-cheapest item.
3. **Category facets need stable counts.** Filtering by category server-side would collapse
   the facet list to the selected category.

One request per filter change is both cheaper and more correct than a page-plus-count. The
dataset is a couple of hundred products, comfortably inside one response.

**Trade-off.** This does not scale to a large catalogue. With a real backend — one that
returned a total count and accepted a sort parameter — server-side paging would be correct,
and `ProductApi.productsResource` already accepts a `pagination` argument for that case.

---

## Category facets come from products, not from `/categories`

**Decision.** The catalogue's category filter is derived from the products actually returned,
grouped by `category.slug` with a count. It never calls `GET /categories`.

**Why.** `GET /categories` returns everything in a shared, publicly writable database:
hundreds of empty test records like `Kategori Testing 1786160779507`. Rendering that list
produced an unusable filter rail.

The first attempt filtered by **name pattern** — anything starting with `test`, containing a
long hex run, or too short. It was brittle, and it did not even catch the real junk. Deriving
facets from products removes the guesswork entirely:

- A category nobody has assigned a product to simply never appears.
- Each facet carries a true count, which is better UX anyway.
- No heuristic to maintain as other users invent new junk.

`CategoryApi.categoriesResource()` still returns the raw, unfiltered list — the admin screens
need to see real data, junk included.

---

## Products are routed by slug, ids are avoided

**Decision.** `/products/:slug`, and `ProductApi` documents the slug lookup as the default.

**Why.** The database is reseeded daily, so numeric ids are recycled. A bookmarked
`/products/42` breaks the next morning and may silently point at a different product. Slugs
are readable, shareable, and stable for the life of a record.

The admin edit route still uses `:id`, because it targets a specific record inside a session
that just listed it.

---

## The cart stores whole products, not ids

**Decision.** `CartLine` holds a full `Product` snapshot rather than a `productId`.

**Why.** The cart is persisted, and the catalogue is reseeded daily. A cart holding only ids
would break the moment those ids disappear — either erroring or silently resolving to
different products. Keeping the snapshot means a saved cart still renders correctly even
after the source record is gone.

Adding an item already in the cart **refreshes** the snapshot, so price and title track the
catalogue while the shopper is active.

---

## Cart persistence does not go through an `effect`

**Decision.** `CartStore.commit()` sets the signal and writes to `localStorage` in the same
synchronous step. Persistence is not driven by `effect()`.

**Why.** An `effect` only runs when the reactive graph is flushed. That makes durability
depend on change detection: a mutation immediately before the tab closes could be lost, and
in tests nothing was ever written at all — which is how this was caught.

Writing inside the mutation makes persistence unconditional and independent of rendering. The
regression test lives in `cart-store.spec.ts` (*"restores its contents from storage in a
fresh injector"*).

---

## Route guards await the session restore

**Decision.** `SessionStore` exposes `whenReady(): Promise<void>`, and both guards `await` it
before deciding.

**Why.** On a **cold load** of a guarded URL, the guard runs before the stored token has been
exchanged for a profile. Without the await, `isAuthenticated()` is still `false` and a
perfectly valid session is redirected to the login page — on every refresh of `/account` or
`/admin`.

This was found by loading `/admin` directly: the guard bounced to login while the header
simultaneously rendered the signed-in user's name.

`SessionStore` self-initialises in its constructor rather than relying on the root component
to call `restore()`, so `whenReady()` is meaningful regardless of who injects it first — a
guard, the header, or `App`.

> Guards must call `inject()` **before** the first `await`; injection context does not
> survive one.

---

## Tokens live in a separate store from the session

**Decision.** `TokenStore` (JWT pair, no HTTP dependency) is separate from `SessionStore`
(profile, injects `AuthApi`). The interceptor reads `TokenStore`.

**Why.** `authInterceptor` needs the access token on every request. If it read `SessionStore`
→ `AuthApi` → `HttpClient` → `authInterceptor`, dependency injection would form a cycle.
Splitting the token — which needs nothing — from the session behaviour breaks it cleanly.

---

## Errors are normalised into one shape at the service boundary

**Decision.** `toApiError()` maps every failure into `ApiError { kind, status, message,
details }`. Components never handle `HttpErrorResponse`.

**Why.** The API returns three different error envelopes, with `message` typed as `string[]`
in one and `string` in the others. Without normalisation, that shape-matching would be spread
across every component.

The `kind` field also papers over the API's strangest behaviour: **a missing record returns
HTTP 400**, not 404. Keying off the status code would be wrong everywhere, so
`kind === 'not-found'` is the contract instead.

---

## Reads use `httpResource`, writes use `HttpClient`

**Decision.** Services expose resource factories for reads and cold observables for writes.

**Why.** Reads are reactive derivations of UI state — change a filter, refetch — which is
exactly what `httpResource` models, including cancellation of the in-flight request and
`isLoading`/`error` as signals. Writes are one-shot commands triggered by an explicit user
action, where a cold observable subscribed inside `submit()` keeps busy and error state next
to the form that owns it.

Factories pass an explicit `injector`, so they are callable from anywhere rather than only
from a field initialiser.

---

## Render mode is chosen per route

**Decision.** Static auth pages prerender; content pages server-render; anything depending on
`localStorage` or a session is client-only; the wildcard returns a real 404.

**Why.** The scaffold's default — prerender everything — is wrong here on two counts. Product
slugs cannot be enumerated at build time and would be stale within hours, and the cart,
checkout, account, and admin screens are meaningless without browser state, so SSR would only
flash an empty shell before hydration replaced it.

Setting `status: 404` on the catch-all prevents a soft-404, where every mistyped URL returns
HTTP 200 and becomes indexable.

---

## Auth is a simulation, and says so

**Decision.** The JWT flow is fully implemented — login, profile, bearer interceptor, guards —
while the UI states plainly that writes are unauthenticated and orders are simulated.

**Why.** The API does not enforce authentication on writes: `POST /products` with no token
returns a validation error, not a 401. Presenting the guards as security would be misleading.
They are a UX affordance that demonstrates the real pattern, and the docs, footer, and admin
banner say so.

The same honesty applies to checkout: there is no payments endpoint, so no card details are
collected at all rather than collecting fake ones.

---

## No component library, no state library

**Decision.** The UI kit (`shared/ui/`) and the stores (`core/state/`) are written in-repo.
Icons are inline SVG path data.

**Why.** The app needs nine small presentational components and five stores. Angular signals
cover the state requirement completely — `signal`, `computed`, and `linkedSignal` — with no
reducers or effects to wire. For the UI, a library would have imposed its own design language
on a bespoke design system, and its own bundle.

Icons are bundled as path data from the Lucide set so they inherit `currentColor`, keep a
single 1.75 stroke weight, and stay crisp — none of which emoji or an icon font would do.

---

## Design system: palette and type taken, layout pattern rejected

**Decision.** The `ui-ux-pro-max` recommendation supplied the colour palette (stone/near-black
with a gold accent) and the type pairing (Rubik + Nunito Sans). Its recommended *pattern*
("Minimal Single Column") and *style* ("Liquid Glass") were not adopted wholesale.

**Why.** "Minimal Single Column" is a landing-page shape — one CTA, no navigation — which does
not fit a filterable catalogue. "Liquid Glass" carries explicit performance and text-contrast
warnings in the tool's own output, and heavy `backdrop-filter` over a dense image grid is
exactly where those bite. Glass is therefore used only on the sticky header, where it is one
composited layer.

The palette and typography were kept because they are WCAG-checked and chosen for e-commerce.

---

## Light and dark are separate palettes

**Decision.** `styles.css` defines a full token set for light, and redefines every token under
`.dark` — rather than inverting or algorithmically darkening.

**Why.** Inverted colours do not preserve contrast. The accent is the clearest case: `#A16207`
reads correctly on a light surface but is muddy on a dark one, so dark mode uses `#FBBF24`
instead. Authoring both deliberately is the only way to guarantee both pass.

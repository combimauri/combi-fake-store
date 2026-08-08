# Features

A screen-by-screen tour of what the app does, and where each part lives.

| Route | Screen | Access |
| --- | --- | --- |
| `/` | [Catalogue](#catalogue) | public |
| `/products/:slug` | [Product detail](#product-detail) | public |
| `/cart` | [Cart](#cart) | public |
| `/checkout` | [Checkout](#checkout) | public |
| `/stores` | [Store locator](#store-locator) | public |
| `/login`, `/register` | [Sign in / register](#sign-in-and-register) | public |
| `/account` | [Account](#account) | signed in |
| `/admin/*` | [Admin](#admin) | admin role |
| anything else | [Not found](#not-found) | public |

---

## Catalogue

`features/catalog/` — the storefront home page.

**Filtering.** Four controls, all combinable:

- **Search** — partial, case-insensitive match on the title. Debounced 300 ms so typing does
  not fire a request per keystroke.
- **Category** — facet chips with live counts, most populated first. Eight are shown, with a
  *Show N more* toggle for the rest.
- **Price range** — min and max, applied on change.
- **Sort** — Featured (the API's own order), price ascending, price descending, or name A–Z.

**Everything lives in the URL.** Filters map to query parameters, so any view is shareable
and the back button restores it:

```
/?q=jogger&category=clothes&min=50&max=150&sort=price-asc&page=2
```

Parameters are merged with `replaceUrl: true`, so adjusting filters does not bury the
previous page under a stack of history entries.

**Pagination** is 12 per page. If a stale `page=9` arrives in the URL, it clamps to the last
real page rather than showing nothing.

**States.** Loading renders a skeleton grid that mirrors the real layout exactly, so nothing
jumps when data lands. Empty offers a *Clear filters* action. Failure shows the normalised
error message with a *Try again* button wired to `resource.reload()`.

**Product cards** show the category, image, title, price, and an add-to-cart button that
flips to *In cart (n)* once the item is in the cart. The first row loads eagerly; the rest
are lazy. Cards animate in with a 35 ms stagger.

---

## Product detail

`features/product-detail/` — addressed by **slug**, not id, so links survive the daily
reseed.

- **Gallery** with thumbnails; selecting one swaps the main image. The active image resets
  automatically when a different product loads.
- **Breadcrumbs** — Shop → Category → Product, where the category link returns to a filtered
  catalogue.
- **Add to cart**, plus a *View cart (n)* link showing the current quantity.
- **Details** — free-delivery threshold, date added, and the product reference.
- **Related products** — four items from `/products/slug/{slug}/related`, with the current
  product filtered out.

If the record has been deleted, the API answers 400 with an `EntityNotFoundError` body. The
page detects this via `kind === 'not-found'` and shows *"This product is no longer
available"* with an explanation about the daily reset — not a generic error.

---

## Cart

`features/cart/` on top of `CartStore`.

- Line items with thumbnail, category, unit price, quantity stepper, line total, and remove.
- Quantity is clamped to 1–99; dropping to zero removes the line.
- Adding a product already in the cart merges into the existing line and **refreshes the
  stored snapshot**, so the price tracks the catalogue.
- Live summary: subtotal, delivery, estimated tax, total.
- A nudge showing how much more is needed for free delivery.
- *Empty cart* clears everything.

**Money rules** (`core/state/cart-store.ts`):

| Rule | Value |
| --- | --- |
| Free delivery above | `$150` |
| Flat delivery rate below that | `$9.90` |
| Estimated tax | `8%` |
| Max quantity per line | `99` |

The cart **survives a refresh and a closed tab** via `localStorage`. Because each line stores
a full product snapshot rather than an id, a saved cart still renders correctly even after
the upstream record has been reseeded away.

---

## Checkout

`features/checkout/` — Signal Forms with per-field validation.

Fields: full name, email, street address, city, postal code, country. All required; the email
is format-checked. Inputs carry proper `autocomplete` attributes so browser autofill works.

If you are signed in, name and email are prefilled from your profile — but only while those
fields are untouched, so it never overwrites something you typed.

Submitting marks every field touched, so all errors appear at once, each below its own field
with an icon and `role="alert"`.

On success the cart is snapshotted into an order, the cart is cleared, and a confirmation
renders with a generated reference (`FS-XXXXXX`), the items ordered, the delivery address,
and the total.

> The API has no orders or payments endpoint. Checkout is **simulated**: no payment details
> are collected, nothing is charged, and nothing ships. This is stated on the form and again
> on the confirmation.

---

## Sign in and register

`features/auth/`.

**Sign in** takes email and password, with a *Use the demo account* button that fills in the
seeded credentials. A failed login is reported as *"That email and password combination was
not recognised"* rather than the API's generic "unauthorized". After signing in you are
returned to wherever you were headed, via the `redirectTo` query parameter a guard added.

**Register** takes name, email, password, and avatar URL. Email availability is checked
**live against the API** while you type, using `validateAsync` against `/users/is-available`;
the field shows *Checking…* while in flight. On success the app signs you straight in, so the
password is never typed twice.

A note under the password field warns that the API stores it in plain text and that a real
password should never be reused here.

---

## Account

`features/account/` — requires a session (`authGuard`).

Shows avatar, name, email, and role, and allows editing name, email, and avatar URL.

Because the API always assigns `customer` to accounts created through it, non-admin users see
an explanation of why the admin area is unavailable to them. Admins get a link into it.

---

## Admin

`features/admin/` — requires the `admin` role (`adminGuard`). A signed-in non-admin is told
why and returned home rather than being sent to a login form they already completed.

A banner states plainly that changes write to the public API and are visible to everyone.

### Products

Sortable table of every product with thumbnail, id, category, and price, plus a client-side
filter over name and category, and a *Refresh* button.

- **Create / edit** share one form; the presence of an `:id` route parameter switches it to
  edit mode and loads the record.
- Validation mirrors the API's own rules — a price below 1 and a description under 10
  characters are both rejected before the request goes out. If the API rejects it anyway, its
  per-field messages render as a list under the error banner.
- **Images**: upload a file (`POST /files/upload`) or paste a URL. At least one is required.
  Each can be previewed and removed.
- **Delete** goes through a confirmation dialog that names the product and warns the removal
  affects everyone.

### Categories

List with inline edit, plus a create/edit panel beside it. Deleting warns that every product
assigned to the category is affected.

---

## Store locator

`features/stores/` — backed by `GET /locations`.

Defaults to Medellín (the origin the API's own examples use) and lists nearby stores sorted
by distance. *Use my location* asks the browser for coordinates and re-sorts around you,
degrading with a clear message if permission is denied or geolocation is unavailable. A
*Within 10 km* toggle applies a radius. Each result links out to Google Maps.

---

## Not found

`features/not-found/` — the catch-all. Returns a **real HTTP 404** from the server (set via
`status: 404` on the wildcard server route) rather than a soft-404, so search engines do not
index mistyped URLs. Copy acknowledges that the daily reset may be the cause.

---

## Cross-cutting

### Theme

Light and dark, following the OS by default; the header toggle pins an explicit choice, which
persists. Light and dark are authored as separate palettes rather than inversions, so
contrast holds in both. `<meta name="theme-color">` follows suit, so browser chrome matches.

### Notifications

`ToastStore` + `shared/ui/toast-host`. Success, error, and info tones, each with its own icon
so meaning never rests on colour alone. Auto-dismiss after 4 s, manually dismissible, and
announced via `aria-live="polite"` without stealing focus.

### Accessibility

- Skip link to main content; `<main>` is focusable for post-navigation focus.
- Visible focus ring on every interactive element — never removed.
- All interactive targets are at least 44 px.
- Icon-only buttons carry `aria-label`; toggles carry `aria-pressed`; the current page carries
  `aria-current`.
- Form errors use `role="alert"` and sit next to their field.
- Colour is never the sole carrier of meaning.
- `prefers-reduced-motion` disables animation, transitions, and view transitions.

### Performance

- Every route is lazily loaded.
- Images are lazy below the fold, eager and high-priority above it.
- Aspect ratios are reserved before load, so there is no layout shift.
- The SSR transfer cache stops the client re-fetching what the server already loaded.
- Skeletons mirror final layouts exactly.

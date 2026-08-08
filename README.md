# FakeStore

A complete, server-rendered e-commerce storefront built with **Angular 22** on top of the
[Platzi Fake Store API](https://fakeapi.platzi.com/). It covers the whole shopping journey —
browse, filter, product detail, cart, checkout — plus authentication, an account area, and a
full admin back office with product and category CRUD.

It is a reference implementation: modern Angular (signals, `httpResource`, Signal Forms,
zoneless change detection, SSR with hydration) applied to a real, messy public API.

---

## Quick start

```bash
npm install
npm start          # http://localhost:4200
```

That is all — the app talks to the public API directly and needs no keys, database, or
`.env` file.

| Command | What it does |
| --- | --- |
| `npm start` | Dev server with SSR and hot reload on `:4200` |
| `npm run build` | Production build into `dist/fake-store` |
| `npm test` | Unit tests (Vitest), single run |
| `npm run watch` | Rebuild on change, development configuration |
| `npm run serve:ssr:fake-store` | Run the built SSR server (see the note in [DEVELOPMENT.md](docs/DEVELOPMENT.md#running-the-production-server-locally)) |

### Demo accounts

| Email | Password | Role | Gives you |
| --- | --- | --- | --- |
| `john@mail.com` | `changeme` | customer | Account area. The login page fills this in for you. |
| `admin@mail.com` | `admin123` | admin | Everything above, plus `/admin` |

Accounts you create through the app are always given the `customer` role by the API, so the
admin area needs one of the seeded admin accounts.

> These are public credentials for a public demo API. Anyone can read, change, or delete the
> data behind them.

---

## Documentation

| Document | Read it when you want to know |
| --- | --- |
| [Features](docs/FEATURES.md) | What the app does, screen by screen |
| [Architecture](docs/ARCHITECTURE.md) | How the code is organised and how data flows |
| [Decisions](docs/DECISIONS.md) | *Why* it is built this way — the non-obvious calls |
| [Upstream API](docs/API.md) | The Platzi API surface and its many quirks |
| [Design system](docs/DESIGN-SYSTEM.md) | Colour, type, spacing, the UI kit, accessibility rules |
| [Development](docs/DEVELOPMENT.md) | Conventions, adding a feature, testing, deployment |

---

## Feature summary

**Storefront**
- Catalogue with search, category facets, price range, four sort orders, and pagination
- Every filter lives in the URL, so any view can be shared, bookmarked, and restored by the back button
- Product detail with an image gallery, breadcrumbs, and related products
- Cart that survives a refresh, with live totals, tax, and a free-delivery threshold
- Checkout with full validation and an order confirmation

**Accounts**
- Sign in and register, with live email-availability checking as you type
- Profile viewing and editing
- JWT attached automatically to API calls; session restored on reload

**Admin** (admin role required)
- Product list with filtering, create, edit, and delete
- Image upload to the API, or by pasting a URL
- Category create, edit, and delete
- Confirmation dialogs before anything destructive

**Throughout**
- Server-side rendering with hydration, tuned per route
- Light and dark themes, following the OS by default
- Store locator backed by the API's geo endpoint, with optional browser geolocation
- Fully keyboard navigable, with a skip link, visible focus, and screen-reader labelling

---

## Tech stack

| | |
| --- | --- |
| Framework | Angular 22.1 — standalone, **zoneless**, signal-based |
| Data | `httpResource` for reads, `HttpClient` for writes |
| Forms | Signal Forms (`@angular/forms/signals`) |
| Styling | Tailwind CSS v4 with a semantic token layer |
| Rendering | Angular SSR (Express), per-route render modes |
| Testing | Vitest + `@angular/core/testing` |
| Language | TypeScript 6, `strict` |

No component library, no state-management library, no icon package — the UI kit and stores
are in-repo and small on purpose.

---

## Project layout

```
src/app/
├── core/           # Non-visual: models, API clients, state, guards, interceptors
│   ├── models/     # Typed API contracts + error normalisation
│   ├── services/   # One client per API resource
│   ├── state/      # Signal stores (cart, session, tokens, theme, toasts)
│   ├── guards/     # Route protection
│   └── interceptors/
├── features/       # One folder per route-level feature, lazily loaded
├── layout/         # Header and footer
└── shared/ui/      # Reusable presentational components
```

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for the dependency rules between these layers.

---

## Things worth knowing up front

The upstream API is a shared public playground, which shapes several design decisions:

- **The database is reseeded daily and anyone can write to it.** Product IDs change, and you
  will see records other people created — categories called `Updated Category Name`, test
  products, and so on. Nothing here is stable.
- **Writes are unauthenticated.** The JWT flow is real, but the API does not enforce it. Auth
  in this app simulates a real storefront's session; it is not a security boundary.
- **Orders are simulated.** The API has no cart, order, payment, or inventory endpoints, so
  the cart lives in `localStorage` and checkout produces a local confirmation. No payment
  details are ever collected and nothing is charged.

[API.md](docs/API.md) documents every quirk found while building this, and how the code
handles each one.

---

## License

[MIT](LICENSE) © Mauricio Arce Torrez

The upstream [Platzi Fake Store API](https://fakeapi.platzi.com/) is a third-party service
with its own terms; this licence covers the code in this repository only.

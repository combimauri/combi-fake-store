# The upstream API

Everything this app knows about the [Platzi Fake Store API](https://fakeapi.platzi.com/),
including the quirks that are not in its documentation. Each quirk lists where the code
deals with it.

- **REST base URL:** `https://api.escuelajs.co/api/v1`
- **GraphQL:** `https://api.escuelajs.co/graphql` (also serves the playground — unused here)
- **Swagger:** `https://api.escuelajs.co/docs`
- **CORS:** `access-control-allow-origin: *`, so the browser calls it directly. No proxy.

The base URL is configured in `src/environments/environment.ts`, injected into every service:

```ts
export const environment = {
  apiBaseUrl: 'https://api.escuelajs.co/api/v1',
};
```

---

## Endpoints in use

### Products — `core/services/product-api.ts`

| Method | Path | Used by |
| --- | --- | --- |
| `GET` | `/products` | Catalogue, admin list |
| `GET` | `/products/slug/{slug}` | Product detail |
| `GET` | `/products/{id}` | Admin edit form |
| `GET` | `/products/slug/{slug}/related` | "You might also like" |
| `POST` | `/products` | Admin create |
| `PUT` | `/products/{id}` | Admin edit |
| `DELETE` | `/products/{id}` | Admin delete |

**Read shape**

```jsonc
{
  "id": 8,
  "title": "Classic Red Jogger Sweatpants",
  "slug": "classic-red-jogger-sweatpants",
  "price": 98,
  "description": "…",
  "images": ["https://…"],
  "category": { "id": 1, "name": "Clothes", "slug": "clothes", "image": "…",
                "creationAt": "…", "updatedAt": "…" },
  "creationAt": "2026-08-08T01:41:43.000Z",
  "updatedAt": "2026-08-08T01:41:43.000Z"
}
```

**Write shape** — note the asymmetry: writes take a flat `categoryId`, reads return a nested
`category` object.

```jsonc
{
  "title": "New Product",
  "price": 10,
  "description": "A description",
  "categoryId": 1,
  "images": ["https://placehold.co/600x400"]   // at least one valid absolute URL
}
```

`PUT` accepts any subset of those fields.

### Filtering — `GET /products`

All parameters combine with AND. Modelled as `ProductFilters` / `ProductQuery` in
`core/models/product-filters.ts`.

| Parameter | Notes |
| --- | --- |
| `title` | **Partial and case-insensitive.** `jogger`, `JOGGER`, and `Classic Red` all match. |
| `price` | Exact match |
| `price_min` / `price_max` | Inclusive bounds. Mapped from `priceMin` / `priceMax`. |
| `categoryId` | By numeric id |
| `categorySlug` | By slug |
| `limit` / `offset` | Pagination — **must be sent together**, see quirk 1 |

### Categories — `core/services/category-api.ts`

| Method | Path |
| --- | --- |
| `GET` | `/categories` |
| `GET` | `/categories/{id}/products` |
| `GET` | `/categories/slug/{slug}` |
| `POST` | `/categories` |
| `PUT` | `/categories/{id}` |
| `DELETE` | `/categories/{id}` |

### Users — `core/services/user-api.ts`

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/users` | |
| `POST` | `/users` | `{ name, email, password, avatar }` |
| `PUT` | `/users/{id}` | |
| `POST` | `/users/is-available` | `{ email }` → `{ "isAvailable": false }` |

Roles are `customer` or `admin`. **Accounts created through the API are always `customer`** —
the role cannot be set on creation, which is why the admin area needs a seeded admin account.

Reads return `password` in plain text. It is deliberately **not** modelled on the `User`
interface so it cannot be rendered or logged by accident.

### Auth (JWT) — `core/services/auth-api.ts`

| Method | Path | Body / Header |
| --- | --- | --- |
| `POST` | `/auth/login` | `{ email, password }` → `{ access_token, refresh_token }` |
| `GET` | `/auth/profile` | `Authorization: Bearer {access_token}` |
| `POST` | `/auth/refresh-token` | `{ refreshToken }` → a new token pair |

Two naming traps: the response uses **snake_case** (`access_token`) while the refresh request
body uses **camelCase** (`refreshToken`).

Token lifetimes are counter-intuitive — the **access token lasts 20 days, the refresh token
only 10 hours**, so the refresh token expires first.

### Files — `core/services/file-api.ts`

`POST /files/upload`, `multipart/form-data`, form field must be named **`file`**.

```jsonc
{ "originalname": "photo.png", "filename": "abc123.png", "location": "https://…" }
```

Use `location` as a product image URL. `GET /files/{filename}` serves it back.

### Locations — `core/services/location-api.ts`

`GET /locations?origin={lat},{lng}&size=12&radius=10`. With no `origin` it returns ten random
locations. Powers the store locator.

---

## Quirks

Each of these was verified against the live API while building. They are the reason several
parts of the code look the way they do.

### 1. `limit` is ignored unless `offset` is also present

```
GET /products?limit=3            → all ~174 products
GET /products?limit=3&offset=0   → 3 products
```

Sending `limit` alone silently returns the entire collection.

**Handled in** `toQueryParams()` in `product-api.ts`, which only ever emits the pair:

```ts
if (query.pagination) {
  params['offset'] = query.pagination.offset;
  params['limit'] = query.pagination.limit;
}
```

Locked in by a test in `product-api.spec.ts`.

### 2. There is no total-count header

No `X-Total-Count`, no pagination envelope — just a bare array. Sizing a paginator therefore
requires fetching the **unpaginated** list and measuring it.

**Handled in** `countProducts()`, and it is the main reason the catalogue pages client-side.
See [DECISIONS.md](DECISIONS.md#the-catalogue-fetches-once-and-pages-client-side).

### 3. A missing record returns **400**, not 404

```jsonc
// GET /products/999999  →  HTTP 400
{
  "path": "/api/v1/products/999999",
  "timestamp": "2026-08-08T21:57:35.358Z",
  "name": "EntityNotFoundError",
  "message": "Could not find any entity of type \"Product\"…"
}
```

**Handled in** `toApiError()`, which maps this body to `kind: 'not-found'`. Guards, resolvers
and components key off `kind`, never the status code. `ProductDetail` uses it to show
"This product is no longer available" rather than a generic failure.

### 4. Three different error envelopes

| Situation | Body | Status |
| --- | --- | --- |
| Validation | `{ statusCode, error: "Bad Request", message: string[] }` | 400 |
| Missing record | `{ path, timestamp, name: "EntityNotFoundError", message: string }` | 400 |
| Everything else | `{ statusCode, message: string }` | 401 / 500 / … |

Note `message` is a **`string[]`** for validation and a **`string`** otherwise — that type
difference is what distinguishes them.

**Handled in** `core/models/api-error.ts`. Validation messages are surfaced per field in
`ApiError.details`; the admin product form renders them as a list under the error banner.

### 5. Writes are completely unauthenticated

`POST /products` with no token returns a 400 validation error, not a 401. Anyone can create,
update, or delete anything.

**Consequence:** the JWT flow in this app simulates a storefront session for UI purposes. It
is not a security boundary, and the admin guard is a UX affordance rather than protection.
Stated plainly in the footer and on the admin screen.

### 6. The database is shared, public, and reseeded daily

Everything is seeded fresh each day (around 01:40 UTC) and anyone may write to it in between.
At the time of writing, category 1 is named `Updated Category Name`, and there are dozens of
records like `Kategori Testing 1786160779507`. Product IDs are not stable — id `1` does not
exist; today's range starts around 8.

**Consequences:**
- Products are routed **by slug**, not id.
- `CartStore` stores a **full product snapshot** per line, not an id, so a saved cart still
  renders after the source record disappears.
- The catalogue derives its category list from the products actually returned, so empty junk
  categories never appear. See [DECISIONS.md](DECISIONS.md#category-facets-come-from-products-not-from-categories).
- Admin edits, and anything you create, are transient by design.

### 7. Image URLs are user-supplied and may be junk

The API only validates that `images` entries are URLs. Records created by other users can
point anywhere, or nowhere.

**Handled in** `shared/ui/safe-image`, which validates the URL, reserves the aspect ratio to
prevent layout shift, and falls back to a neutral placeholder on error instead of a broken
image glyph.

### 8. No cart, orders, payments, inventory, reviews, or ratings

The API has none of these endpoints, and products carry no rating or stock fields.

**Consequence:** cart and checkout are entirely client-side, and the confirmation screen is
generated locally. Nothing is charged and no payment details are collected.

---

## Quick reference

```bash
# All products
curl 'https://api.escuelajs.co/api/v1/products'

# Paginated — both params required
curl 'https://api.escuelajs.co/api/v1/products?offset=0&limit=12'

# Filtered
curl 'https://api.escuelajs.co/api/v1/products?title=jogger&price_min=50&price_max=150'

# One product by slug
curl 'https://api.escuelajs.co/api/v1/products/slug/classic-red-jogger-sweatpants'

# Log in, then read the profile
TOKEN=$(curl -s -X POST 'https://api.escuelajs.co/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@mail.com","password":"admin123"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')

curl 'https://api.escuelajs.co/api/v1/auth/profile' -H "Authorization: Bearer $TOKEN"
```

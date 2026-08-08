You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection

---

# This project: FakeStore

An Angular 22 storefront on the public Platzi Fake Store API. Read `README.md` first, then
the guide in `docs/` that matches your task:

| Task | Read |
| --- | --- |
| Understand the layout of the code | `docs/ARCHITECTURE.md` |
| Understand *why* something is built oddly | `docs/DECISIONS.md` |
| Call the API | `docs/API.md` |
| Touch anything visual | `docs/DESIGN-SYSTEM.md` |
| Add a feature, run tests, deploy | `docs/DEVELOPMENT.md` |
| Know what a screen does | `docs/FEATURES.md` |

## Project-specific rules

These override nothing above, but they are easy to get wrong here:

- **The API is a shared public database, reseeded daily.** Never hardcode a product or
  category ID. Route products by **slug**.
- **`limit` is ignored unless `offset` is sent too.** `toQueryParams()` in `product-api.ts`
  handles this; do not "simplify" it.
- **A missing record returns HTTP 400, not 404.** Detect it with `toApiError(...).kind ===
  'not-found'`, never by status code.
- **Never call `GET /categories` for storefront filtering.** It is full of junk records
  created by other users. Derive category facets from the products actually returned.
- **Guards must `await session.whenReady()`** before checking authentication, and must call
  `inject()` before that await.
- **Persist store state inside the mutation**, not from an `effect()`.
- **Use design tokens** (`bg-surface`, `text-muted-foreground`, `.btn`, `.card`). A raw hex
  value in a component means a token is missing.
- **No emoji as icons.** Add path data to the `PATHS` map in `shared/ui/icon/icon.ts`.
- **Writes are unauthenticated upstream.** Auth here is a UX simulation, not a security
  boundary — do not describe it as protection.
- Run `npm run build` and `npm test` before considering a change done.

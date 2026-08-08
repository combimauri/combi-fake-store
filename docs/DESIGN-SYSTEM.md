# Design system

Everything visual is defined in one file — `src/styles.css`. There is no component library
and no per-component colour. This document explains the tokens, the component classes, the
UI kit, and the accessibility rules that constrain all of it.

The original recommendation from `ui-ux-pro-max` is preserved in
`design-system/fake-store/MASTER.md`. What was adopted from it, and what was rejected, is
recorded in [DECISIONS.md](DECISIONS.md#design-system-palette-and-type-taken-layout-pattern-rejected).

**Direction:** premium minimal, product-first. Near-black and warm stone neutrals, a single
gold accent reserved for commerce actions, generous whitespace, restrained motion.

---

## Colour

Colours are **semantic tokens**, never raw hex in components. Light and dark are authored as
two complete palettes rather than one inverted into the other, so contrast is guaranteed in
both.

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--surface` | `#fafaf9` | `#0c0a09` | Page background |
| `--surface-raised` | `#ffffff` | `#1c1917` | Cards, inputs, menus |
| `--surface-sunken` | `#f5f5f4` | `#171412` | Hero band, table headers, hover fills |
| `--foreground` | `#0c0a09` | `#fafaf9` | Body text |
| `--muted-foreground` | `#57534e` | `#a8a29e` | Secondary text |
| `--primary` | `#1c1917` | `#fafaf9` | Primary buttons |
| `--on-primary` | `#ffffff` | `#0c0a09` | Text on primary |
| `--accent` | `#a16207` | `#fbbf24` | Commerce CTAs, links, active state |
| `--accent-soft` | `#fef3c7` | `#292219` | Accent backgrounds |
| `--on-accent` | `#ffffff` | `#1c1917` | Text on accent |
| `--border` | `#d6d3d1` | `#292524` | Default borders |
| `--border-strong` | `#a8a29e` | `#44403c` | Hover and emphasised borders |
| `--destructive` | `#dc2626` | `#f87171` | Errors, delete |
| `--destructive-soft` | `#fef2f2` | `#2a1616` | Error backgrounds |
| `--success` | `#15803d` | `#4ade80` | Confirmations |
| `--success-soft` | `#f0fdf4` | `#14231a` | Success backgrounds |
| `--ring` | `#1c1917` | `#fbbf24` | Focus ring |
| `--overlay` | `rgb(12 10 9 / .55)` | `rgb(0 0 0 / .7)` | Modal scrim |

Note the accent changes hue between themes on purpose: `#a16207` is legible on a light
surface but muddy on a dark one, so dark mode uses the brighter `#fbbf24`.

### How theming works

```css
:root { --accent: #a16207; }           /* light palette   */
.dark { --accent: #fbbf24; }           /* dark palette    */

@theme inline {                        /* expose to Tailwind */
  --color-accent: var(--accent);
}
```

`@theme inline` is what makes `bg-accent` resolve the custom property **at runtime**. Without
`inline`, Tailwind would bake the light value into the utility and dark mode would not
follow.

Dark mode is a `.dark` class on `<html>`, applied by `ThemeStore`. A class rather than a media
query, so the in-app toggle can override the OS. Default is `system`.

### Using tokens

```html
<div class="bg-surface-raised text-foreground border">…</div>
<p class="text-muted-foreground">Secondary copy</p>
<button class="btn btn-accent">Checkout</button>
```

Borders need no colour utility — a base rule sets every element's `border-color` to
`--border`, so `border` alone is correct.

---

## Typography

| Role | Family | Where |
| --- | --- | --- |
| Display | **Rubik** (400–700) | `h1`–`h4`, prices, brand |
| Body | **Nunito Sans** (300–700) | Everything else |

Both load from Google Fonts with `display=swap` and `preconnect`. Applied via `--font-display`
and `--font-sans`, so `font-display` and `font-sans` are the utilities.

Headings get `letter-spacing: -0.02em` and `line-height: 1.15`; body is `1.6`. Base size is
16 px — never smaller for body text, which also avoids iOS zoom-on-focus.

### Tabular numbers

Any changing number uses `.tabular` (`font-variant-numeric: tabular-nums`) so digits share a
width and columns do not jitter as values change:

```html
<p class="tabular">{{ total() | currency: 'USD' }}</p>
```

Applied to prices, totals, quantities, counts, page numbers, and IDs.

---

## Component classes

Defined in `@layer components` in `styles.css`, so they can be composed with Tailwind
utilities and overridden with `!` where needed.

### Buttons

```html
<button class="btn btn-primary">Add to cart</button>
<button class="btn btn-accent">Checkout</button>
<button class="btn btn-outline btn-sm">Cancel</button>
<button class="btn btn-ghost">Subtle</button>
<button class="btn btn-danger btn-sm">Delete</button>
```

| Class | Role |
| --- | --- |
| `.btn` | Base — pill, 44 px min height, `cursor-pointer`, 200 ms transitions |
| `.btn-primary` | Default action |
| `.btn-accent` | Commerce CTA — checkout, place order. **One per screen.** |
| `.btn-outline` | Secondary |
| `.btn-ghost` | Tertiary, icon buttons |
| `.btn-danger` | Destructive |
| `.btn-sm` | 36 px compact variant |

`.btn` has a 2.75 rem (44 px) minimum height, so every button meets the touch-target
requirement without extra thought. Hover lifts primary and accent by 1 px; the reduced-motion
block removes that.

### Other primitives

| Class | Role |
| --- | --- |
| `.card` | Raised surface, `--radius-card` (0.875 rem), bordered |
| `.input` | Text inputs, selects, textareas. 44 px min height. |
| `.input-invalid` | Destructive border for a failed field |
| `.label` | Field label |
| `.field-error` | Error text under a field |
| `.skeleton` | Pulsing loading placeholder |
| `.chip` / `.chip-active` | Filter facets and toggles |
| `.tabular` | Tabular figures |
| `.animate-rise` | Entrance animation, staggered via `--stagger` |

### Staggered entrance

```html
<combi-product-card class="animate-rise" [style.--stagger.ms]="i * 35" />
```

380 ms, `cubic-bezier(0.22, 1, 0.36, 1)`, `backwards` fill so items are invisible until their
turn. Used for grids, toasts, and dialogs.

---

## UI kit

`src/app/shared/ui/` — nine presentational components. All are `OnPush`, signal-based, and
take `input()` / emit `output()`.

| Component | Selector | Purpose |
| --- | --- | --- |
| `Icon` | `<combi-icon>` | Inline SVG from bundled Lucide path data |
| `SafeImage` | `<combi-safe-image>` | Image with URL validation, reserved ratio, placeholder fallback |
| `ProductCard` | `<combi-product-card>` | Catalogue tile with quick add |
| `QuantityStepper` | `<combi-quantity-stepper>` | Accessible −/+ quantity control |
| `Pagination` | `<combi-pagination>` | Page numbers with ellipsis gaps |
| `EmptyState` | `<combi-empty-state>` | No-results placeholder with optional action |
| `ConfirmDialog` | `<combi-confirm-dialog>` | Destructive-action confirmation |
| `ToastHost` | `<combi-toast-host>` | Notification overlay |
| `ThemeToggle` | `<combi-theme-toggle>` | Light/dark switch |

### Icons

```html
<combi-icon name="cart" [size]="18" />
```

Path data lives in a `PATHS` map in `icon.ts`. All icons share `stroke-width: 1.75`, inherit
`currentColor`, and are `aria-hidden` — the accessible name belongs to the surrounding
button.

**Never use emoji as icons.** They render differently per platform and cannot be themed.

To add one: copy the `d` attribute from a 24×24 Lucide icon into `PATHS`. The `IconName` type
updates automatically.

### SafeImage

```html
<combi-safe-image [src]="product.images[0]" [alt]="product.title"
                  ratio="4 / 5" [eager]="true" />
```

Product images come from a database anyone can write to, so URLs are routinely broken or
malformed. This component validates the URL, reserves the aspect ratio before load (no layout
shift), fades in on load, and falls back to a neutral placeholder on error. `loaded` and
`failed` are `linkedSignal`s keyed on `src`, so swapping the gallery image resets both.

Set `eager` on above-the-fold images; everything else lazy-loads.

---

## Layout

| Breakpoint | Width | Behaviour |
| --- | --- | --- |
| base | 375 px+ | Single column; 2-up product grid; filters stacked above results |
| `sm` | 640 px | Two-column form fields |
| `md` | 768 px | 3-up product grid; desktop nav replaces the hamburger |
| `lg` | 1024 px | Sticky filter rail beside results; sticky order summary |
| `xl` | 1280 px | 4-up product grid |

Page content is capped at `max-w-7xl` with `px-4 sm:px-6 lg:px-8` gutters. Spacing follows a
4/8 px rhythm via Tailwind's default scale.

Wide content — the admin products table — scrolls inside its own `overflow-x-auto` container,
so the page body never scrolls horizontally.

---

## Motion

| Kind | Duration | Easing |
| --- | --- | --- |
| Micro-interactions (hover, colour) | 200 ms | default |
| Entrances | 380 ms | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Image fade-in | 500 ms | default |
| Stagger step | 35 ms | — |

Only `transform` and `opacity` are animated. Route changes use the View Transitions API where
supported.

`prefers-reduced-motion: reduce` collapses every animation and transition to 0.01 ms and
disables smooth scrolling and the button hover lift. This is a blanket rule in `styles.css`,
so new components inherit it automatically.

---

## Accessibility rules

Non-negotiable across the app:

1. **Focus is always visible.** A global `:focus-visible` rule draws a 2 px `--ring` outline
   with 2 px offset. Never remove it.
2. **Touch targets are ≥ 44 px.** Built into `.btn` and `.input`; icon buttons use `h-11 w-11`.
3. **Icon-only controls have `aria-label`**, and labels are specific — *"Remove Classic Red
   Jogger Sweatpants from cart"*, not *"Remove"*.
4. **Colour is never the only signal.** Errors pair red with an icon and text; toasts carry a
   per-tone icon; active chips change shape and weight, not just colour.
5. **Form errors** sit below their field, carry `role="alert"`, and appear only after submit
   or blur.
6. **State is announced** — `aria-pressed` on toggles, `aria-current="page"` on the active
   nav item, `aria-expanded` on disclosures, `aria-live="polite"` on result counts and toasts.
7. **Headings are sequential.** One `h1` per screen.
8. **Contrast** meets WCAG AA (4.5:1 body, 3:1 large) in **both** themes — verified
   separately, since light values do not carry over.
9. **A skip link** precedes the header; `<main>` is focusable so focus can move there after
   navigation.
10. **Modals** trap nothing the user cannot escape — the scrim and Escape both cancel.

---

## Adding a new screen

1. Reach for existing tokens and `.btn` / `.card` / `.input` classes. Adding a raw hex value
   is a signal that a token is missing — add the token instead.
2. Reuse the UI kit before writing a new component.
3. Give the screen a loading state (skeleton mirroring the final layout), an empty state
   (`EmptyState`), and an error state (message plus a retry wired to `resource.reload()`).
4. Check it at 375 px and in dark mode before considering it done.
5. Tab through it. If you cannot see where focus is, it is not finished.

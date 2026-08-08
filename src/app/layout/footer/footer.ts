import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'combi-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <footer class="mt-20 border-t bg-surface-sunken">
      <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p class="font-display text-base font-semibold">
              Fake<span class="text-accent">Store</span>
            </p>
            <p class="mt-2 max-w-xs text-sm text-muted-foreground">
              A reference storefront built on the Platzi Fake Store API.
            </p>
          </div>

          <div>
            <h2 class="text-xs font-semibold tracking-wider uppercase">Shop</h2>
            <ul class="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a routerLink="/" class="transition-colors hover:text-foreground">All products</a>
              </li>
              <li>
                <a routerLink="/cart" class="transition-colors hover:text-foreground">Cart</a>
              </li>
              <li>
                <a routerLink="/stores" class="transition-colors hover:text-foreground"
                  >Store locator</a
                >
              </li>
            </ul>
          </div>

          <div>
            <h2 class="text-xs font-semibold tracking-wider uppercase">Account</h2>
            <ul class="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a routerLink="/login" class="transition-colors hover:text-foreground">Sign in</a>
              </li>
              <li>
                <a routerLink="/register" class="transition-colors hover:text-foreground"
                  >Create account</a
                >
              </li>
              <li>
                <a routerLink="/account" class="transition-colors hover:text-foreground"
                  >My account</a
                >
              </li>
            </ul>
          </div>

          <div>
            <h2 class="text-xs font-semibold tracking-wider uppercase">About the data</h2>
            <p class="mt-3 text-sm text-muted-foreground">
              Products come from a public database that anyone can edit and that is reseeded daily.
              Orders are simulated locally.
            </p>
          </div>
        </div>

        <p class="mt-10 border-t pt-6 text-xs text-muted-foreground">
          Demo project. Not a real shop — no payment is ever taken.
        </p>
      </div>
    </footer>
  `,
})
export class Footer {}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Icon } from '../../../shared/ui/icon/icon';

/** Chrome shared by every admin screen. */
@Component({
  selector: 'combi-admin-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-3xl font-semibold">Admin</h1>
          <p class="mt-1 text-sm text-muted-foreground">
            Changes here write to the public API and are visible to everyone.
          </p>
        </div>
        <a routerLink="/admin/products/new" class="btn btn-primary btn-sm">
          <combi-icon name="plus" [size]="15" />
          New product
        </a>
      </header>

      <nav class="mt-8 flex gap-1 border-b" aria-label="Admin sections">
        <a
          routerLink="/admin/products"
          routerLinkActive="!border-accent !text-foreground"
          class="border-b-2 border-transparent px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          Products
        </a>
        <a
          routerLink="/admin/categories"
          routerLinkActive="!border-accent !text-foreground"
          class="border-b-2 border-transparent px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          Categories
        </a>
      </nav>

      <div class="mt-8">
        <router-outlet />
      </div>
    </div>
  `,
})
export class AdminShell {}

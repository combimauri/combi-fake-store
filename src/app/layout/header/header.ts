import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { CartStore } from '../../core/state/cart-store';
import { SessionStore } from '../../core/state/session-store';
import { ToastStore } from '../../core/state/toast-store';
import { Icon } from '../../shared/ui/icon/icon';
import { ThemeToggle } from '../../shared/ui/theme-toggle/theme-toggle';

@Component({
  selector: 'combi-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink, RouterLinkActive, ThemeToggle],
  templateUrl: './header.html',
})
export class Header {
  protected readonly cart = inject(CartStore);
  protected readonly session = inject(SessionStore);
  private readonly toasts = inject(ToastStore);
  private readonly router = inject(Router);

  protected readonly menuOpen = signal(false);
  protected readonly accountMenuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
    this.accountMenuOpen.set(false);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
    this.accountMenuOpen.set(false);
  }

  protected toggleAccountMenu(): void {
    this.accountMenuOpen.update((open) => !open);
  }

  protected signOut(): void {
    this.session.signOut();
    this.closeMenu();
    this.toasts.info('You have been signed out.');
    void this.router.navigate(['/']);
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SessionStore } from './core/state/session-store';
import { ThemeStore } from './core/state/theme-store';
import { Footer } from './layout/footer/footer';
import { Header } from './layout/header/header';
import { ToastHost } from './shared/ui/toast-host/toast-host';

@Component({
  selector: 'combi-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Footer, Header, RouterOutlet, ToastHost],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor() {
    // Both are instantiated for their constructor work: ThemeStore applies the
    // `dark` class, SessionStore starts exchanging a stored token for a profile.
    inject(ThemeStore);
    inject(SessionStore);
  }
}

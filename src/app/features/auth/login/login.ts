import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ApiError } from '../../../core/models';
import { SessionStore } from '../../../core/state/session-store';
import { ToastStore } from '../../../core/state/toast-store';
import { Icon } from '../../../shared/ui/icon/icon';

/** Demo credentials the API ships with, offered as a one-click fill. */
const DEMO = { email: 'john@mail.com', password: 'changeme' };

@Component({
  selector: 'combi-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Icon, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toasts = inject(ToastStore);

  protected readonly busy = signal(false);
  protected readonly failure = signal<string | undefined>(undefined);

  protected readonly model = signal({ email: '', password: '' });

  protected readonly loginForm = form(this.model, (path) => {
    required(path.email, { message: 'Enter your email address.' });
    email(path.email, { message: 'That does not look like an email address.' });
    required(path.password, { message: 'Enter your password.' });
  });

  protected fillDemo(): void {
    this.model.set({ ...DEMO });
    this.failure.set(undefined);
  }

  protected signIn(): void {
    submit(this.loginForm, async () => {
      this.busy.set(true);
      this.failure.set(undefined);

      try {
        const user = await new Promise<{ name: string }>((resolve, reject) => {
          this.session.signIn(this.model()).subscribe({ next: resolve, error: reject });
        });

        this.toasts.success(`Welcome back, ${user.name}.`);
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') ?? '/';
        await this.router.navigateByUrl(redirectTo);
      } catch (error) {
        const apiError = error as ApiError;
        // A 401 here means bad credentials, which is worth saying plainly
        // rather than showing the generic "not authorized" copy.
        this.failure.set(
          apiError.kind === 'unauthorized'
            ? 'That email and password combination was not recognised.'
            : apiError.message,
        );
      } finally {
        this.busy.set(false);
      }
    });
  }
}

import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import {
  FormField,
  email,
  form,
  minLength,
  required,
  submit,
  validateAsync,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiError } from '../../../core/models';
import { UserApi } from '../../../core/services/user-api';
import { SessionStore } from '../../../core/state/session-store';
import { ToastStore } from '../../../core/state/toast-store';
import { Icon } from '../../../shared/ui/icon/icon';

const DEFAULT_AVATAR = 'https://i.pravatar.cc/300';

@Component({
  selector: 'combi-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Icon, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  private readonly userApi = inject(UserApi);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastStore);

  protected readonly busy = signal(false);
  protected readonly failure = signal<string | undefined>(undefined);

  protected readonly model = signal({
    name: '',
    email: '',
    password: '',
    avatar: DEFAULT_AVATAR,
  });

  protected readonly registerForm = form(this.model, (path) => {
    required(path.name, { message: 'Enter your name.' });
    minLength(path.name, 2, { message: 'That name looks too short.' });

    required(path.email, { message: 'Enter an email address.' });
    email(path.email, { message: 'That does not look like an email address.' });

    required(path.password, { message: 'Choose a password.' });
    minLength(path.password, 4, {
      message: 'Use at least 4 characters.',
    });

    required(path.avatar, { message: 'An avatar URL is required.' });

    // The API exposes a dedicated availability check, so the address is
    // verified while typing instead of failing on submit.
    validateAsync(path.email, {
      params: ({ value }) => value(),
      factory: (address) =>
        resource({
          params: address,
          loader: async ({ params, abortSignal }) => {
            const candidate = params.trim();
            // Skip the round trip until the field could plausibly be an email.
            if (!candidate || !candidate.includes('@')) return true;

            abortSignal.addEventListener('abort', () => undefined);
            return firstValueFrom(this.userApi.isEmailAvailable(candidate));
          },
        }),
      onSuccess: (isAvailable) =>
        isAvailable ? undefined : { kind: 'taken', message: 'That email is already registered.' },
      onError: () => ({
        kind: 'unavailable',
        message: 'We could not check that email. Try again.',
      }),
    });
  });

  protected createAccount(): void {
    submit(this.registerForm, async () => {
      this.busy.set(true);
      this.failure.set(undefined);

      try {
        const payload = this.model();
        await firstValueFrom(this.userApi.createUser(payload));

        // Sign straight in so the shopper never types the password twice.
        await firstValueFrom(
          this.session.signIn({
            email: payload.email,
            password: payload.password,
          }),
        );

        this.toasts.success('Your account is ready.');
        await this.router.navigateByUrl('/');
      } catch (error) {
        const apiError = error as ApiError;
        this.failure.set(apiError.details.length > 0 ? apiError.details[0] : apiError.message);
      } finally {
        this.busy.set(false);
      }
    });
  }
}

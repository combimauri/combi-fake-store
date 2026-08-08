import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormField, email, form, minLength, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiError } from '../../../core/models';
import { UserApi } from '../../../core/services/user-api';
import { SessionStore } from '../../../core/state/session-store';
import { ToastStore } from '../../../core/state/toast-store';
import { Icon } from '../../../shared/ui/icon/icon';
import { SafeImage } from '../../../shared/ui/safe-image/safe-image';

@Component({
  selector: 'combi-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Icon, RouterLink, SafeImage],
  templateUrl: './account.html',
})
export class Account {
  protected readonly session = inject(SessionStore);
  private readonly userApi = inject(UserApi);
  private readonly toasts = inject(ToastStore);

  protected readonly busy = signal(false);
  protected readonly failure = signal<string | undefined>(undefined);

  protected readonly model = signal({ name: '', email: '', avatar: '' });

  protected readonly profileForm = form(this.model, (path) => {
    required(path.name, { message: 'Enter your name.' });
    minLength(path.name, 2, { message: 'That name looks too short.' });
    required(path.email, { message: 'Enter an email address.' });
    email(path.email, { message: 'That does not look like an email address.' });
    required(path.avatar, { message: 'An avatar URL is required.' });
  });

  constructor() {
    // Seed the form once the profile arrives from the session restore.
    effect(() => {
      const user = this.session.user();
      if (!user) return;

      this.model.set({
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      });
    });
  }

  protected save(): void {
    submit(this.profileForm, async () => {
      const user = this.session.user();
      if (!user) return;

      this.busy.set(true);
      this.failure.set(undefined);

      try {
        await firstValueFrom(this.userApi.updateUser(user.id, this.model()));
        this.toasts.success('Profile updated.');
      } catch (error) {
        const apiError = error as ApiError;
        this.failure.set(apiError.details.length > 0 ? apiError.details[0] : apiError.message);
      } finally {
        this.busy.set(false);
      }
    });
  }
}

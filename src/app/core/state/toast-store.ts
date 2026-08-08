import { Service, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  readonly id: number;
  readonly tone: ToastTone;
  readonly message: string;
}

const DISMISS_AFTER_MS = 4000;

/** Transient notifications rendered by `ToastHost`. */
@Service()
export class ToastStore {
  private nextId = 0;
  private readonly active = signal<readonly Toast[]>([]);

  readonly toasts = this.active.asReadonly();

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  dismiss(id: number): void {
    this.active.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private push(tone: ToastTone, message: string): void {
    const id = this.nextId++;
    this.active.update((toasts) => [...toasts, { id, tone, message }]);
    // Auto-dismiss keeps the stack from growing without stealing focus.
    setTimeout(() => this.dismiss(id), DISMISS_AFTER_MS);
  }
}

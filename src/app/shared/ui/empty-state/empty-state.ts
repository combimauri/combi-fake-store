import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon, IconName } from '../icon/icon';

/** Placeholder shown when a list has no results, with an optional action. */
@Component({
  selector: 'combi-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div
        class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-sunken text-muted-foreground"
      >
        <combi-icon [name]="icon()" [size]="24" />
      </div>
      <h2 class="text-lg font-semibold">{{ title() }}</h2>
      <p class="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {{ description() }}
      </p>
      <ng-content />
    </div>
  `,
})
export class EmptyState {
  readonly icon = input<IconName>('package');
  readonly title = input.required<string>();
  readonly description = input('');
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'combi-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, RouterLink],
  template: `
    <combi-empty-state
      icon="search"
      title="Page not found"
      description="That link does not lead anywhere. It may have been removed, or the daily catalogue reset may have taken it."
    >
      <a routerLink="/" class="btn btn-primary btn-sm mt-5">Back to the shop</a>
    </combi-empty-state>
  `,
})
export class NotFound {}

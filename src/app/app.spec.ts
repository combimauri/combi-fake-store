import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('renders the shell with a skip link, header and footer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('a[href="#main"]')?.textContent).toContain('Skip to content');
    expect(root.querySelector('combi-header')).toBeTruthy();
    expect(root.querySelector('combi-footer')).toBeTruthy();
    expect(root.querySelector('main#main')).toBeTruthy();
  });
});

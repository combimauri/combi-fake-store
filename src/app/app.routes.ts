import { Routes } from '@angular/router';

import { adminGuard, authGuard } from './core/guards/auth-guard';

/**
 * Every feature is lazily loaded, so the initial bundle carries only the
 * catalogue and the shell.
 */
export const routes: Routes = [
  {
    path: '',
    title: 'FakeStore — Shop everything',
    loadComponent: () => import('./features/catalog/catalog/catalog').then((m) => m.Catalog),
  },
  {
    path: 'products/:slug',
    title: 'Product — FakeStore',
    loadComponent: () =>
      import('./features/product-detail/product-detail/product-detail').then(
        (m) => m.ProductDetail,
      ),
  },
  {
    path: 'cart',
    title: 'Your cart — FakeStore',
    loadComponent: () => import('./features/cart/cart-page/cart-page').then((m) => m.CartPage),
  },
  {
    path: 'checkout',
    title: 'Checkout — FakeStore',
    loadComponent: () => import('./features/checkout/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'stores',
    title: 'Store locator — FakeStore',
    loadComponent: () => import('./features/stores/stores/stores').then((m) => m.Stores),
  },
  {
    path: 'login',
    title: 'Sign in — FakeStore',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    title: 'Create an account — FakeStore',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'account',
    title: 'My account — FakeStore',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/account/account').then((m) => m.Account),
  },
  {
    path: 'admin',
    title: 'Admin — FakeStore',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-shell/admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'products' },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/admin-products/admin-products').then((m) => m.AdminProducts),
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./features/admin/product-form/product-form').then((m) => m.ProductForm),
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./features/admin/product-form/product-form').then((m) => m.ProductForm),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/admin/admin-categories/admin-categories').then(
            (m) => m.AdminCategories,
          ),
      },
    ],
  },
  {
    path: '**',
    title: 'Page not found — FakeStore',
    loadComponent: () => import('./features/not-found/not-found/not-found').then((m) => m.NotFound),
  },
];

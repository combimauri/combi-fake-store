import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import { ApiError, Product } from '../models';
import { ProductApi } from './product-api';

const BASE_URL = 'https://api.escuelajs.co/api/v1/products';

function productFixture(overrides: Partial<Product> = {}): Product {
  return {
    id: 8,
    title: 'Classic Red Jogger Sweatpants',
    slug: 'classic-red-jogger-sweatpants',
    price: 98,
    description: 'Soft, durable joggers.',
    images: ['https://placehold.co/600x400'],
    category: {
      id: 1,
      name: 'Clothes',
      slug: 'clothes',
      image: 'https://placehold.co/600x400',
      creationAt: '2026-08-08T01:41:43.000Z',
      updatedAt: '2026-08-08T01:41:43.000Z',
    },
    creationAt: '2026-08-08T01:41:43.000Z',
    updatedAt: '2026-08-08T01:41:43.000Z',
    ...overrides,
  };
}

describe('ProductApi', () => {
  let service: ProductApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('query parameters', () => {
    it('sends offset alongside limit, since the API ignores a lone limit', () => {
      service.getProducts({ pagination: { offset: 20, limit: 10 } }).subscribe();

      const req = httpTesting.expectOne(
        (r) => r.url === BASE_URL && r.params.get('limit') === '10',
      );
      expect(req.request.params.get('offset')).toBe('20');
      req.flush([]);
    });

    it('maps price bounds onto the snake_case names the API expects', () => {
      service.getProducts({ priceMin: 50, priceMax: 60 }).subscribe();

      const req = httpTesting.expectOne((r) => r.url === BASE_URL);
      expect(req.request.params.get('price_min')).toBe('50');
      expect(req.request.params.get('price_max')).toBe('60');
      req.flush([]);
    });

    it('omits filters that were not supplied', () => {
      service.getProducts({ title: 'jogger' }).subscribe();

      const req = httpTesting.expectOne((r) => r.url === BASE_URL);
      expect(req.request.params.get('title')).toBe('jogger');
      expect(req.request.params.has('categoryId')).toBe(false);
      expect(req.request.params.has('limit')).toBe(false);
      expect(req.request.params.has('offset')).toBe(false);
      req.flush([]);
    });
  });

  describe('countProducts', () => {
    it('measures the unpaginated collection, keeping filters but dropping the window', async () => {
      const total = firstValue(service.countProducts({ categorySlug: 'shoes' }));

      const req = httpTesting.expectOne((r) => r.url === BASE_URL);
      expect(req.request.params.get('categorySlug')).toBe('shoes');
      expect(req.request.params.has('limit')).toBe(false);
      req.flush([productFixture(), productFixture({ id: 9 })]);

      await expect(total).resolves.toBe(2);
    });
  });

  describe('error normalization', () => {
    it('classifies the 400 EntityNotFoundError body as not-found', async () => {
      const failure = firstError(service.getProductBySlug('missing'));

      httpTesting.expectOne(`${BASE_URL}/slug/missing`).flush(
        {
          path: '/api/v1/products/slug/missing',
          timestamp: '2026-08-08T21:57:35.358Z',
          name: 'EntityNotFoundError',
          message: 'Could not find any entity of type "Product"',
        },
        { status: 400, statusText: 'Bad Request' },
      );

      const error = await failure;
      expect(error.kind).toBe('not-found');
      expect(error.status).toBe(400);
    });

    it('surfaces field-level messages from a validation failure', async () => {
      const failure = firstError(
        service.createProduct({
          title: '',
          price: -1,
          description: '',
          categoryId: 1,
          images: [],
        }),
      );

      httpTesting.expectOne(BASE_URL).flush(
        {
          statusCode: 400,
          error: 'Bad Request',
          message: ['title should not be empty', 'price must be a positive number'],
        },
        { status: 400, statusText: 'Bad Request' },
      );

      const error = await failure;
      expect(error.kind).toBe('validation');
      expect(error.details).toEqual([
        'title should not be empty',
        'price must be a positive number',
      ]);
    });

    it('reports an unreachable server as a network failure', async () => {
      const failure = firstError(service.getProducts());

      httpTesting.expectOne((r) => r.url === BASE_URL).error(new ProgressEvent('error'));

      await expect(failure).resolves.toMatchObject({
        kind: 'network',
        status: 0,
      });
    });
  });

  describe('resources', () => {
    it('re-fetches when the slug signal changes', async () => {
      const slug = signal<string | undefined>(undefined);
      const resource = TestBed.runInInjectionContext(() => service.productBySlugResource(slug));

      // An undefined slug must not produce a request at all.
      TestBed.tick();
      httpTesting.verify();

      slug.set('classic-red-jogger-sweatpants');
      TestBed.tick();
      httpTesting
        .expectOne(`${BASE_URL}/slug/classic-red-jogger-sweatpants`)
        .flush(productFixture());
      await Promise.resolve();
      TestBed.tick();

      expect(resource.value()?.slug).toBe('classic-red-jogger-sweatpants');
    });
  });
});

/** Resolves with the first emitted value. */
function firstValue<T>(source: Observable<T>): Promise<T> {
  return firstValueFrom(source);
}

/** Resolves with the {@link ApiError} the source fails with. */
async function firstError(source: Observable<unknown>): Promise<ApiError> {
  try {
    await firstValueFrom(source);
  } catch (error) {
    return error as ApiError;
  }
  throw new Error('expected the request to fail');
}

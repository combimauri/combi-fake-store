import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { toApiError } from '../models';

/** Response of `POST /files/upload`. */
interface UploadResult {
  readonly originalname: string;
  readonly filename: string;
  /** Absolute URL of the stored file, suitable for a product image. */
  readonly location: string;
}

/** Uploads images used as product and category artwork. */
@Service()
export class FileApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/files`;

  /**
   * Uploads one file and resolves with its public URL.
   *
   * The form field must be named `file`; the endpoint rejects anything else.
   */
  upload(file: File): Observable<string> {
    const body = new FormData();
    body.append('file', file);

    return this.http.post<UploadResult>(`${this.baseUrl}/upload`, body).pipe(
      map((result) => result.location),
      catchError(this.fail),
    );
  }

  private readonly fail = (error: unknown): Observable<never> =>
    throwError(() => toApiError(error));
}

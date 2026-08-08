import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateUser, EmailAvailability, UpdateUser, User, toApiError } from '../models';

/** Data access for the users endpoints. */
@Service()
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/users`;

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl).pipe(catchError(this.fail));
  }

  createUser(payload: CreateUser): Observable<User> {
    return this.http.post<User>(this.baseUrl, payload).pipe(catchError(this.fail));
  }

  updateUser(id: number, changes: UpdateUser): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, changes).pipe(catchError(this.fail));
  }

  /** Checks whether an email can still be registered. */
  isEmailAvailable(email: string): Observable<boolean> {
    return this.http.post<EmailAvailability>(`${this.baseUrl}/is-available`, { email }).pipe(
      map((result) => result.isAvailable),
      catchError(this.fail),
    );
  }

  private readonly fail = (error: unknown): Observable<never> =>
    throwError(() => toApiError(error));
}

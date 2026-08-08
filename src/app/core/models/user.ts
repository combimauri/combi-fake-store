/** Roles the API assigns to a user. */
export type UserRole = 'customer' | 'admin';

/**
 * A user account.
 *
 * The API returns `password` in plain text on every read. It is modelled here
 * because it is on the wire, but it must never be rendered or logged.
 */
export interface User {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
  readonly avatar: string;
  readonly creationAt: string;
  readonly updatedAt: string;
}

/** Body accepted by `POST /users`. */
export interface CreateUser {
  name: string;
  email: string;
  password: string;
  avatar: string;
}

/** Body accepted by `PUT /users/:id`. */
export type UpdateUser = Partial<Omit<CreateUser, 'password'>>;

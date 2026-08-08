/** Coarse classification of a failed request, derived from the response body. */
export type ApiErrorKind = 'not-found' | 'validation' | 'unauthorized' | 'network' | 'unknown';

/**
 * A normalized error.
 *
 * The API returns three different error envelopes, so failures are mapped onto
 * this single shape rather than leaking `HttpErrorResponse` into components.
 */
export interface ApiError {
  readonly kind: ApiErrorKind;
  /** HTTP status, or 0 for network and timeout failures. */
  readonly status: number;
  /** Human-readable summary, safe to render directly. */
  readonly message: string;
  /** Individual validation failures; empty for other kinds. */
  readonly details: readonly string[];
}

/**
 * The union of the three error envelopes the API returns.
 *
 * - Validation: `{statusCode, error: 'Bad Request', message: string[]}`
 * - Missing record: `{path, timestamp, name: 'EntityNotFoundError', message}`
 * - Everything else: `{statusCode, message}`
 *
 * `message` is deliberately widened to `string | string[]`, since its type is
 * what distinguishes a validation failure from the other two.
 */
interface ErrorBody {
  statusCode?: number;
  error?: string;
  name?: string;
  path?: string;
  timestamp?: string;
  message?: string | string[];
}

function isRecord(value: unknown): value is ErrorBody {
  return typeof value === 'object' && value !== null;
}

/**
 * Maps an `HttpErrorResponse` onto an {@link ApiError}.
 *
 * The important quirk: a missing record comes back as **400** carrying an
 * `EntityNotFoundError` body, not a 404. Route guards and resolvers must key
 * off `kind === 'not-found'` rather than the status code.
 */
export function toApiError(error: unknown): ApiError {
  const status =
    isRecord(error) && typeof (error as { status?: unknown }).status === 'number'
      ? (error as { status: number }).status
      : 0;
  const body: ErrorBody =
    isRecord(error) && isRecord((error as { error?: unknown }).error)
      ? (error as { error: ErrorBody }).error
      : {};

  if (body.name === 'EntityNotFoundError' || status === 404) {
    return {
      kind: 'not-found',
      status,
      message: 'The requested record does not exist.',
      details: [],
    };
  }

  if (Array.isArray(body.message)) {
    return {
      kind: 'validation',
      status,
      message: 'The submitted data is invalid.',
      details: body.message,
    };
  }

  if (status === 401 || status === 403) {
    return {
      kind: 'unauthorized',
      status,
      message: 'You are not authorized to perform this action.',
      details: [],
    };
  }

  if (status === 0) {
    return {
      kind: 'network',
      status,
      message: 'The server could not be reached. Check your connection.',
      details: [],
    };
  }

  return {
    kind: 'unknown',
    status,
    message:
      typeof body.message === 'string' && body.message.length > 0
        ? body.message
        : 'Something went wrong. Please try again.',
    details: [],
  };
}

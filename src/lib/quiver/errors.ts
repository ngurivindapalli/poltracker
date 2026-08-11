/**
 * Quiver Quantitative API errors.
 */

export class QuiverError extends Error {
  readonly status?: number;
  readonly path?: string;
  readonly code: string;
  readonly retryable: boolean;

  constructor(
    message: string,
    opts: {
      status?: number;
      path?: string;
      code?: string;
      retryable?: boolean;
      cause?: unknown;
    } = {}
  ) {
    super(message);
    this.name = "QuiverError";
    this.status = opts.status;
    this.path = opts.path;
    this.code = opts.code ?? "QUIVER_ERROR";
    this.retryable = opts.retryable ?? false;
    if (opts.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = opts.cause;
    }
  }
}

export class QuiverAuthError extends QuiverError {
  constructor(message = "Quiver authentication failed", path?: string) {
    super(message, {
      status: 401,
      path,
      code: "QUIVER_AUTH",
      retryable: false,
    });
    this.name = "QuiverAuthError";
  }
}

export class QuiverRateLimitError extends QuiverError {
  constructor(message = "Quiver rate limit exceeded", path?: string) {
    super(message, {
      status: 429,
      path,
      code: "QUIVER_RATE_LIMIT",
      retryable: true,
    });
    this.name = "QuiverRateLimitError";
  }
}

export class QuiverSchemaError extends QuiverError {
  constructor(message: string, path?: string) {
    super(message, {
      path,
      code: "QUIVER_SCHEMA",
      retryable: false,
    });
    this.name = "QuiverSchemaError";
  }
}

import { createLogger } from "../server/utils/logger";

const log = createLogger("mvc.errors.appwide");

function normalizeErrorContext(
  error: Error,
  context: Record<string, unknown>,
  source: string,
): Record<string, unknown> {
  const nested =
    context.originalError instanceof Error
      ? {
          name: context.originalError.name,
          message: context.originalError.message,
          stack: context.originalError.stack,
        }
      : context.error instanceof Error
        ? {
            name: context.error.name,
            message: context.error.message,
            stack: context.error.stack,
          }
        : null;

  return {
    ...context,
    errorName: error.name,
    errorMessage: error.message,
    errorStack: error.stack,
    ...(nested ? { nestedError: nested } : {}),
    source,
  };
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public context: Record<string, unknown> = {},
    public source: string = "controllers.base",
  ) {
    super(message);
    this.name = "NETWORK ERROR";
    this.context = context;
    log.error(
      {
        err: this,
        context: normalizeErrorContext(this, context, source),
        source,
      },
      message,
    );
  }
}

export class ApplicationError extends Error {
  constructor(
    message: string,
    public context: Record<string, unknown> = {},
    public source: string = "controllers.base",
  ) {
    super(message);
    this.name = "APPLICATION ERROR";
    this.context = context;
    log.error(
      {
        err: this,
        context: normalizeErrorContext(this, context, source),
        source,
      },
      message,
    );
  }
}

export class NotFoundError extends Error {
  constructor(
    message: string,
    public context: Record<string, unknown> = {},
    public source: string = "controllers.base",
  ) {
    super(message);
    this.name = "NOT FOUND ERROR";
    this.context = context;
    log.error(
      {
        err: this,
        context: normalizeErrorContext(this, context, source),
        source,
      },
      message,
    );
  }
}

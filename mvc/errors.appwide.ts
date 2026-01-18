import { createLogger } from "../server/utils/logger";

const log = createLogger("mvc.errors.appwide");

export class NetworkError extends Error {
  constructor(
    message: string,
    public context: Record<string, unknown> = {},
    public source: string = "controllers.base"
  ) {
    super(message);
    this.name = "NETWORK ERROR";
    this.context = context;
    log.error({ err: this, context, source }, message);
  }
}

export class ApplicationError extends Error {
  constructor(
    message: string,
    public context: Record<string, unknown> = {},
    public source: string = "controllers.base"
  ) {
    super(message);
    this.name = "APPLICATION ERROR";
    this.context = context;
    log.error({ err: this, context, source }, message);
  }
}

import { createLogger } from "../server/utils/logger";

const log = createLogger("mvc.errors.db");
export class DatabaseError extends Error {
  constructor(
    message: string,
    public context: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "DATABASE ERROR";
    this.context = context;
    log.error({ err: this, context }, message);
  }
}

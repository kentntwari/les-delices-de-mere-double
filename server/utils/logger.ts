import pino from "pino";

export const isDev = process.env.NODE_ENV !== "production";

/**
 * Creates a request logger object for API endpoint logging.
 * Provides a standardized way to log incoming requests with file, path, method, and data.
 *
 * @param file - The file path of the endpoint (e.g., "/api/item/index.post.ts")
 * @returns Object with log methods for request logging
 *
 * @example
 * const reqLogger = createRequestLogger("/api/item/index.post.ts");
 * reqLogger.info(event.path, "POST", await readBody(event), "Creating new menu item");
 */
export function createRequestLogger(file: string) {
  const formatRequestMessage = (
    method: string,
    msg: string,
    color: string,
  ): string => {
    if (isDev) {
      return `${color}[${method} REQUEST RECEIVED]:${colors.reset}: ${msg}`;
    }
    return `[${method} REQUEST RECEIVED]: ${msg}`;
  };

  return {
    info: (path: string, method: string, data: unknown, msg: string) => {
      logger.info(
        { file, path, method, data },
        formatRequestMessage(method, msg, colors.blue),
      );
    },
    error: (path: string, method: string, data: unknown, msg: string) => {
      logger.error(
        { file, path, method, data },
        formatRequestMessage(method, msg, colors.red),
      );
    },
    warn: (path: string, method: string, data: unknown, msg: string) => {
      logger.warn(
        { file, path, method, data },
        formatRequestMessage(method, msg, colors.yellow),
      );
    },
    debug: (path: string, method: string, data: unknown, msg: string) => {
      logger.debug(
        { file, path, method, data },
        formatRequestMessage(method, msg, colors.gray),
      );
    },
    success: (path: string, method: string, data: unknown, msg: string) => {
      logger.info(
        { file, path, method, data },
        formatRequestMessage(method, msg, colors.green),
      );
    },
  };
}

/**
 * Converts a dot-notation context (e.g., "mvc.controllers.user")
 * into a readable module name (e.g., "USER CONTROLLER").
 */
function formatModuleName(context: string): string {
  const parts = context.split(".");
  const layer = parts[1] ?? ""; // controllers, service, factories, etc.
  const module = parts[2] ?? parts[1] ?? "app";

  // Singularize layer names for display
  const layerMap: Record<string, string> = {
    controllers: "CONTROLLER",
    service: "SERVICE",
    services: "SERVICE",
    factories: "FACTORY",
    mapper: "MAPPER",
    mappers: "MAPPER",
    repository: "REPOSITORY",
    repositories: "REPOSITORY",
    policies: "POLICY",
    errors: "ERROR",
  };

  const layerName = layerMap[layer] ?? layer.toUpperCase();
  const moduleName = module.toUpperCase().replace(/-/g, " ");

  return `${moduleName} ${layerName}`.trim();
}

/**
 * Extracts the caller's file location from the stack trace.
 * Returns the folder/filename format.
 */
function getCallerLocation(): string {
  const err = new Error();
  const stack = err.stack?.split("\n") ?? [];

  // Skip: Error, getCallerLocation, formatMessage, log method, and find actual caller
  for (let i = 4; i < stack.length; i++) {
    const line = stack[i];
    // Match file paths - handles both Windows and Unix paths
    const match =
      line?.match(/\((.+):(\d+):(\d+)\)$/) ??
      line?.match(/at (.+):(\d+):(\d+)$/);
    if (match) {
      const filePath = match[1];
      // Extract folder and filename from the path
      const pathParts = filePath?.split(/[/\\]/) ?? [];
      const fileName = pathParts.pop() ?? "unknown";
      const folderName = pathParts.pop() ?? "";
      return folderName ? `${folderName}/${fileName}` : fileName;
    }
  }
  return "unknown";
}

/**
 * Pino logger instance configured for the application.
 *
 * In development: Uses pino-pretty for readable, colorized output.
 * In production: Outputs structured JSON for log aggregation systems.
 *
 * Log format: [MODULE NAME]:[LEVEL]: message, {source: context}
 * Example: [USER CONTROLLER]:[ERROR]: User not found, {source: mvc.controllers.user}
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        messageFormat: "{msg}",
        customColors:
          "error:red,warn:yellow,info:blue,debug:gray,trace:gray,fatal:red",
        useOnlyCustomProps: false,
      },
    },
  }),
});

// ANSI color codes for custom formatting
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
} as const;

/**
 * Creates a child logger with a specific context.
 * The context is used to identify the source module in logs.
 *
 * @param context - Dot-notation path (e.g., "mvc.controllers.user")
 * @returns Logger instance with formatted output methods
 *
 * @example
 * const log = createLogger("mvc.controllers.user");
 *
 * // Error (red): [USER CONTROLLER]: User not found, {source: mvc.controllers.user}
 * log.error({ userId: "123" }, "User not found");
 *
 * // Info (blue): [USER CONTROLLER]: User fetched, {source: mvc.controllers.user}
 * log.info({ userId: "123" }, "User fetched");
 *
 * // Success (green): [USER CONTROLLER]: Order created, {source: mvc.controllers.user}
 * log.success({ orderId: "456" }, "Order created");
 */
export function createLogger(context: string) {
  const moduleName = formatModuleName(context);
  const childLogger = logger.child({ source: context });

  const formatMessage = (msg: string, color: string): string => {
    if (isDev) {
      return `${color}[${moduleName}]: ${colors.reset}: ${msg} ${colors.gray}${colors.reset}`;
    }
    return `[${moduleName}]: ${msg}`;
  };

  return {
    /**
     * Log an error (red). Use for exceptions, failures, and error conditions.
     * @example log.error({ err: error, userId }, "Failed to fetch user");
     */
    error: (obj: object, msg: string) => {
      childLogger.error(obj, formatMessage(msg, colors.red));
    },

    /**
     * Log a warning (yellow). Use for unexpected but recoverable conditions.
     * @example log.warn({ attempt: 3 }, "Retry limit approaching");
     */
    warn: (obj: object, msg: string) => {
      childLogger.warn(obj, formatMessage(msg, colors.yellow));
    },

    /**
     * Log info (blue). Use for general informational messages.
     * @example log.info({ userId }, "Processing user request");
     */
    info: (obj: object, msg: string) => {
      childLogger.info(obj, formatMessage(msg, colors.blue));
    },

    /**
     * Log success (green). Use for successful operations and completions.
     * @example log.success({ orderId }, "Order created successfully");
     */
    success: (obj: object, msg: string) => {
      childLogger.info(obj, formatMessage(msg, colors.green));
    },

    /**
     * Log debug info (gray). Use for detailed debugging information.
     * @example log.debug({ payload }, "Request payload received");
     */
    debug: (obj: object, msg: string) => {
      childLogger.debug(obj, formatMessage(msg, colors.gray));
    },

    /**
     * Log trace (gray). Use for very detailed tracing information.
     * @example log.trace({ stack }, "Entering function");
     */
    trace: (obj: object, msg: string) => {
      childLogger.trace(obj, formatMessage(msg, colors.gray));
    },

    /**
     * Log fatal error (red). Use for unrecoverable system failures.
     * @example log.fatal({ err }, "Database connection lost");
     */
    fatal: (obj: object, msg: string) => {
      childLogger.fatal(obj, formatMessage(msg, colors.red));
    },
  };
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * PINO LOGGING ESSENTIALS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. CREATING A LOGGER
 *    Import createLogger and provide a context path:
 *
 *    import { createLogger } from "../../server/utils/logger";
 *    const log = createLogger("mvc.controllers.menu");
 *
 * ───────────────────────────────────────────────────────────────────────────
 *
 * 2. LOG LEVELS (from most to least severe)
 *
 *    | Level   | Color  | When to Use                                    |
 *    |---------|--------|------------------------------------------------|
 *    | fatal   | red    | System is unusable, app must stop              |
 *    | error   | red    | Operation failed, exception caught             |
 *    | warn    | yellow | Unexpected condition, but recoverable          |
 *    | info    | blue   | General information, state changes             |
 *    | success | green  | Operation completed successfully               |
 *    | debug   | gray   | Detailed debugging info (dev only by default)  |
 *    | trace   | gray   | Very detailed tracing (usually disabled)       |
 *
 * ───────────────────────────────────────────────────────────────────────────
 *
 * 3. BASIC USAGE
 *
 *    // Always pass an object first, then the message string
 *    log.info({ userId: "123" }, "User login attempt");
 *    log.error({ err: error, context: "checkout" }, "Payment failed");
 *    log.success({ orderId: "456" }, "Order placed successfully");
 *
 *    // Empty object if no additional context needed
 *    log.info({}, "Server started");
 *
 * ───────────────────────────────────────────────────────────────────────────
 *
 * 4. LOGGING ERRORS
 *
 *    // Use the 'err' key for Error objects - Pino serializes them specially
 *    try {
 *      await riskyOperation();
 *    } catch (error) {
 *      log.error({ err: error, userId }, "Operation failed");
 *    }
 *
 * ───────────────────────────────────────────────────────────────────────────
 *
 * 5. OUTPUT FORMAT
 *
 *    Development (colorized):
 *    [USER CONTROLLER]:[ERROR]: User not found
 *      source: "mvc.controllers.user"
 *      userId: "123"
 *
 *    Production (JSON):
 *    {"level":50,"time":1704931200000,"source":"mvc.controllers.user",
 *     "userId":"123","msg":"[USER CONTROLLER]:[ERROR]: User not found"}
 *
 * ───────────────────────────────────────────────────────────────────────────
 *
 * 6. CONTEXT NAMING CONVENTION
 *
 *    Use dot-notation: "mvc.<layer>.<module>"
 *
 *    Examples:
 *    - "mvc.controllers.user"     → [USER CONTROLLER]
 *    - "mvc.service.menu"         → [MENU SERVICE]
 *    - "mvc.factories.item"       → [ITEM FACTORY]
 *    - "mvc.repository.order"     → [ORDER REPOSITORY]
 *    - "mvc.mapper.user"          → [USER MAPPER]
 *    - "mvc.policies.order"       → [ORDER POLICY]
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

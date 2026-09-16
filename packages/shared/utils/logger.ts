import pino from "pino";

export const isDev = process.env.NODE_ENV !== "production";

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

function formatModuleName(context: string): string {
  const parts = context.split(".");
  const layer = parts[1] ?? "";
  const module = parts[2] ?? parts[1] ?? "app";

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

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
} as const;

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
    error: (obj: object, msg: string) => {
      childLogger.error(obj, formatMessage(msg, colors.red));
    },
    warn: (obj: object, msg: string) => {
      childLogger.warn(obj, formatMessage(msg, colors.yellow));
    },
    info: (obj: object, msg: string) => {
      childLogger.info(obj, formatMessage(msg, colors.blue));
    },
    success: (obj: object, msg: string) => {
      childLogger.info(obj, formatMessage(msg, colors.green));
    },
    debug: (obj: object, msg: string) => {
      childLogger.debug(obj, formatMessage(msg, colors.gray));
    },
    trace: (obj: object, msg: string) => {
      childLogger.trace(obj, formatMessage(msg, colors.gray));
    },
    fatal: (obj: object, msg: string) => {
      childLogger.fatal(obj, formatMessage(msg, colors.red));
    },
  };
}

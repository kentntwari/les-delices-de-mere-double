import { errorMap } from "../../shared/utils/errorMap";
import { createLogger } from "../../server/utils/logger";
import { ApplicationError, NetworkError } from "../errors.appwide";

const log = createLogger("mvc.controllers.base");

export type TReturnJSONData = { data: any };
export type PossibleResponse =
  | JsonResponse<TReturnJSONData>
  | SuccessResponse
  | NotFoundResponse
  | BadRequestResponse
  | UnauthorizedResponse
  | ForbiddenResponse
  | SilentSuccessResponse
  | InternalServerErrorResponse;

export class SuccessResponse extends Response {
  public readonly name = "SUCCESS RESPONSE";

  constructor(
    public message: string = "Success",
    public data: {},
    headers: HeadersInit = {}
  ) {
    super(JSON.stringify({ message, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }
}

export class SilentSuccessResponse extends Response {
  public readonly name = "SILENT SUCCESS RESPONSE";

  constructor(status: number = 204, headers: HeadersInit = {}) {
    super(null, {
      status,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }
}

export class JsonResponse<K extends TReturnJSONData> extends Response {
  public readonly name = "JSON RESPONSE";

  constructor(public data: K, status: number = 200, headers: HeadersInit = {}) {
    super(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }
}

export class BadRequestResponse extends Response {
  public readonly name = "BAD REQUEST RESPONSE";

  constructor(
    public message: string = "Bad Request",
    headers: HeadersInit = {},
    context?: Record<string, string>
  ) {
    super(JSON.stringify({ error: message, context: context ?? {} }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }
}

export class UnauthorizedResponse extends Response {
  public readonly name = "UNAUTHORIZED RESPONSE";

  constructor(
    public message: string = "Unauthorized",
    headers: HeadersInit = {},
    context?: Record<string, string>
  ) {
    super(JSON.stringify({ error: message, context: context ?? {} }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }
}

export class ForbiddenResponse extends Response {
  public readonly name = "FORBIDDEN RESPONSE";

  constructor(
    public message: string = "Forbidden",
    headers: HeadersInit = {},
    context?: Record<string, string>
  ) {
    super(JSON.stringify({ error: message, context: context ?? {} }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }
}

export class NotFoundResponse extends Response {
  public readonly name = "NOT FOUND RESPONSE";

  constructor(
    public message: string = "Not Found",
    headers: HeadersInit = {},
    context?: Record<string, string>
  ) {
    super(JSON.stringify({ error: message, context: context ?? {} }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }
}

export class InternalServerErrorResponse extends Response {
  public readonly name = "INTERNAL SERVER ERROR RESPONSE";

  constructor(
    public message: string = "Internal Server Error",
    context?: Record<string, string>,
    headers: HeadersInit = {}
  ) {
    super(JSON.stringify({ error: message, context: context ?? {} }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }
}

export abstract class BaseController {
  constructor(readonly req: Request) {
    // this.logRequest();
    this.ensureJsonContentType();
  }

  protected get method(): string {
    return this.req.method;
  }

  protected get url(): string {
    return this.req.url;
  }

  protected get headers(): Headers {
    return this.req.headers;
  }

  protected ensureJsonContentType(): void {
    const method = this.method?.toUpperCase?.() ?? "";
    // Only enforce JSON content-type for methods that are expected to carry a body
    if (!["POST", "PUT", "PATCH"].includes(method)) return;

    const raw = this.headers?.get?.("content-type") ?? "";
    const contentType = raw.toLowerCase().trim();

    // Accept standard JSON and vendor-specific types like application/*+json
    const isJson =
      contentType.includes("application/json") || contentType.includes("+json");

    if (!isJson) {
      throw new BadRequestResponse(
        errorMap.app.general.BAD_REQUEST,
        {},
        {
          expectedContentType: "application/json or application/*+json",
          receivedContentType: contentType || "none",
          method,
        }
      );
    }
  }

  /**
   * Parses the request body as JSON.
   *
   * Gotchas:
   * - `req.json()` throws on empty bodies, so clients must send `{}` at minimum
   *   for POST/PUT/PATCH requests (no silent `null` return for empty payloads).
   * - Body stream can only be consumed once; calling this method twice will fail.
   */
  protected async getBody(): Promise<unknown> {
    const method = this.method?.toUpperCase?.() ?? "";
    if (["GET", "HEAD"].includes(method)) return null;

    try {
      return await this.req.json();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);

      switch (true) {
        // Malformed or empty JSON payload
        case e instanceof SyntaxError:
        case /invalid json/i.test(msg):
        case /unexpected end of json input/i.test(msg):
          throw new BadRequestResponse(
            errorMap.app.general.BAD_REQUEST,
            {},
            {
              method,
              error: msg,
              cause: "Invalid JSON payload",
            }
          );

        // Body was already consumed
        case e instanceof TypeError &&
          /already been (read|consumed|used)/i.test(msg):
          throw new InternalServerErrorResponse(
            errorMap.app.general.INTERNAL_SERVER_ERROR,
            {
              method,
              error: msg,
              cause: "Request body stream already consumed",
            }
          );

        // Request aborted while reading
        case (e as any)?.name === "AbortError":
          throw new InternalServerErrorResponse(
            errorMap.sys.general.INTERNAL_SERVER_ERROR,
            {
              method,
              error: msg,
              cause: "Request aborted while reading body",
            }
          );

        default:
          throw new InternalServerErrorResponse(
            errorMap.sys.general.INTERNAL_SERVER_ERROR,
            {
              method,
              error: msg,
            }
          );
      }
    }
  }

  protected logError(error: unknown, context?: object): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    log.error({ err: errorObj, ...context }, errorObj.message);
  }

  protected async authenticate(): Promise<void> {}
  protected async authorize(): Promise<void> {}

  public abstract read(args: any): Promise<PossibleResponse>;
  public abstract create(args: any): Promise<PossibleResponse>;
  public abstract update(args: any): Promise<PossibleResponse>;
  public abstract delete(
    args: any
  ): Promise<Omit<PossibleResponse, "JsonResponse" | "SuccessResponse">>;

  // TODO: Must implement this method
  // protected abstract sanitizeRequest(
  //   req: Request,
  //   ...args: any[]
  // ): Promise<void> | void;

  protected mapErrorResponse(error: unknown, context?: object) {
    switch (true) {
      case error instanceof NetworkError:
        return new InternalServerErrorResponse(
          errorMap.sys.general.INTERNAL_SERVER_ERROR,
          {
            context: JSON.stringify(error.context),
          }
        );

      case error instanceof ApplicationError:
        return new BadRequestResponse(
          errorMap.app.general.BAD_REQUEST,
          {},
          {
            context: JSON.stringify(error.context),
          }
        );

      default:
        return new InternalServerErrorResponse(
          errorMap.app.general.INTERNAL_SERVER_ERROR,
          {
            context: JSON.stringify({ originalError: error, ...context }),
          }
        );
    }
  }
}

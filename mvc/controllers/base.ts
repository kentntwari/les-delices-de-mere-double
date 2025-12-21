import { errorMap } from "~~/shared/utils/errorMap";
import { ApplicationError, NetworkError } from "../errors.appwide";
export type PossibleResponse =
  | JsonResponse
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

export class JsonResponse extends Response {
  public readonly name = "JSON RESPONSE";

  constructor(
    public data: {},
    status: number = 200,
    headers: HeadersInit = {}
  ) {
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

  // Todo: implement pino
  // protected logRequest(): void {
  //   // Universal header extraction that works with any format
  //   const headersObj: Record<string, string> = {};

  //   if (this.headers instanceof Headers) {
  //     this.headers.forEach((value, key) => {
  //       headersObj[key] = value;
  //     });
  //   } else if (typeof this.headers === "object" && this.headers !== null) {
  //     Object.assign(headersObj, this.headers);
  //   }
  // }

  // Todo: Must implement pino for logging
  protected logError(error: unknown, context?: object): void {}

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

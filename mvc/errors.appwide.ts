export class NetworkError extends Error {
  constructor(
    message: string,
    public context: Record<string, unknown> = {},
    public source: string = "controllers.base"
  ) {
    super(message);
    this.name = "NETWORK ERROR";
    this.context = context;
    // TODO: Must implement pino for logging
    console.log(`[NetworkError]: ${this.message}`, this.context);
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
    // TODO: Must implement pino for logging
    console.log(`[ApplicationError]: ${this.message}`, this.context);
  }
}

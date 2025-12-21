export class DatabaseError extends Error {
  constructor(message: string, public context: Record<string, unknown> = {}) {
    super(message);
    this.name = "DATABASE ERROR";
    this.context = context;
    console.log(`[DatabaseError]: ${this.message}`, this.context);
  }
}


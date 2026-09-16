import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export const DB_FAILED_HEALTH_CHECK = "Database health check failed";

export class DatabaseClientError extends Error {
  constructor(
    message: string,
    public readonly context: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "DatabaseClientError";
  }
}

export async function tryHealthCheck(): Promise<void> {
  try {
    await db.$connect();
    await db.$queryRaw`SELECT 1`;
  } catch (error) {
    throw new DatabaseClientError(DB_FAILED_HEALTH_CHECK, {
      root: error,
    });
  }
}

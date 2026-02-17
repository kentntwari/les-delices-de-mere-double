import { PrismaClient } from "@prisma/client";
import { DatabaseError } from "~~/mvc/errors.db";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export const DB_FAILED_HEALTH_CHECK = "Database health check failed";
export async function tryHealthCheck() {
  try {
    await db.$connect();
    await db.$queryRaw`SELECT 1`;
  } catch (error) {
    logger.error(DB_FAILED_HEALTH_CHECK);
    throw new DatabaseError(DB_FAILED_HEALTH_CHECK, {
      root: error,
    });
  }
}

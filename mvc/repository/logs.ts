import { Prisma } from "@prisma/client";

import { db as dbClient } from "../../server/utils/db";

export type LogsModel = Prisma.OrderLogsGetPayload<{}>;

export interface ILogsRepository {
  createLog(orderId: string, message: string): Promise<LogsModel>;
  getLogsByOrderId(orderId: string): Promise<LogsModel[]>;
}
export class OrderLogsRepository implements ILogsRepository {
  constructor(private db = dbClient) {}

  static createOrderLogMessage(createdAt: string, user: string) {
    return `Order created at ${createdAt} by ${user}`;
  }

  async createLog(orderId: string, message: string) {
    return await this.db.orderLogs.create({
      data: {
        order: { connect: { id: orderId } },
        message,
      },
    });
  }

  async getLogsByOrderId(orderId: string, orderBy: "asc" | "desc" = "asc") {
    return await this.db.orderLogs.findMany({
      where: { orderId },
      orderBy: { createdAt: orderBy },
    });
  }
}

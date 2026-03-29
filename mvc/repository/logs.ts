import { Prisma } from "@prisma/client";

import { db as dbClient } from "../../server/utils/db";
import { OrderRepository } from "./order";
import { DatabaseError } from "../errors.db";

import { DateUtils } from "../../shared/utils/date";

export type LogsModel = Prisma.OrderLogGetPayload<{}>;

export const LogsRepositoryFailuresMessages = {
  createLog: "Failed to create order log in database",
  getLogsByOrderId: "Failed to get order logs from database",
} as const;

export interface ILogsRepository {
  createLog(orderId: string, message: string): Promise<LogsModel>;
  getLogsByOrderId(orderId: string): Promise<LogsModel[]>;
}
export class OrderLogsRepository implements ILogsRepository {
  constructor(
    private db = dbClient,
    private orderRepo: OrderRepository = new OrderRepository(this.db),
  ) {}

  static createOrderLogMessage(createdAt: string, user: string) {
    return `Order created ${DateUtils.convertDate(createdAt)} by ${user}`;
  }

  static updatePaymentStatusLogMessage(
    status: string,
    updatedAt: string,
    user: string,
  ) {
    return `Payment status updated to ${status} ${DateUtils.convertDate(updatedAt)} by ${user}`;
  }

  static deleteOrderLogMessage(deletedAt: string, user: string) {
    return `Order deleted ${DateUtils.convertDate(deletedAt)} by ${user}`;
  }

  async createLog(orderId: string, message: string) {
    try {
      const currentOrder = await this.orderRepo.getOrder(orderId);

      if (!currentOrder)
        throw new DatabaseError(`Order with id ${orderId} not found`, {
          operation: "createLog",
        });

      return await this.db.orderLog.create({
        data: {
          order: { connect: { id: orderId } },
          message,
        },
      });
    } catch (error) {
      throw new DatabaseError(LogsRepositoryFailuresMessages.createLog, {
        operation: "createLog",
        error,
      });
    }
  }

  async getLogsByOrderId(orderId: string, orderBy: "asc" | "desc" = "asc") {
    return await this.db.orderLog.findMany({
      where: { orderId },
      orderBy: { createdAt: orderBy },
    });
  }
}

import { Prisma, PrismaClient } from "@prisma/client";

import { db as dbClient } from "../../server/utils/db";

import { DatabaseError } from "../errors.db";

export type OrderModel = Prisma.OrderGetPayload<{
  omit: {
    createdAt: true;
    updatedAt: true;
  };
  include: {
    items: {
      include: {
        item: {
          select: {
            title: true;
            unitPrice: true;
          };
        };
      };
    };
  };
}>;

interface IOrderRepository {
  getAllOrders(): Promise<OrderModel[]>;
  getOrder(id: string): Promise<OrderModel | null>;
}

export class OrderRepository implements IOrderRepository {
  constructor(private db: PrismaClient = dbClient) {}

  async getAllOrders() {
    try {
      return await this.db.order.findMany({
        include: {
          items: {
            include: {
              item: {
                select: {
                  title: true,
                  unitPrice: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to get all orders from database", {
        operation: "getAllOrders",
        error,
      });
    }
  }

  async getOrder(id: string) {
    try {
      return await this.db.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              item: {
                select: {
                  title: true,
                  unitPrice: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to get order from database", {
        operation: "getOrder",
        orderId: id,
        error,
      });
    }
  }
}

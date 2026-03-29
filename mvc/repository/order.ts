import { nanoid, customAlphabet } from "nanoid";
import { Prisma, PrismaClient } from "@prisma/client";

import { db as dbClient } from "../../server/utils/db";

import { DatabaseError } from "../errors.db";
import { CustomerRepository } from "./customer";

import { OrderTransformer } from "../transformers/order";

const numericalAlphabet = "0123456789";
const shortNanoid = customAlphabet(numericalAlphabet, 5);

export type OrderModel = Prisma.OrderGetPayload<{
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

export type OrderedItemModel = Prisma.OrderedItemGetPayload<{
  omit: {
    itemId: true;
    createdAt: true;
    updatedAt: true;
  };
  include: {
    item: { select: { id: true; title: true; slug: true; unitPrice: true } };
  };
}>;

export type OrderCommentModel = Prisma.OrderCommentGetPayload<{
  include: {
    user: { select: { name: true } };
  };
  orderId: true;
  likedBy: true;
  taggedUserId: true;
}>;

export type OrderLogModel = Prisma.OrderLogGetPayload<{}>;

export const RepositoryFailuresMessages = {
  getAllOrders: "Failed to get all orders from database",
  getOrder: "Failed to get order from database",
  getOrderComments: "Failed to get order comments from database",
  getOrderLogs: "Failed to get order logs from database",
  createOrder: "Failed to create order in database",
  updateOrderStatus: "Failed to update order status in database",
  updateOrderPaymentStatus: "Failed to update order payment status in database",
  deleteOrder: "Failed to delete order from database",
} as const;

interface IOrderRepository {
  getAllOrders(): Promise<OrderModel[]>;
  getOrder(id: string): Promise<OrderModel | null>;
  getOrderComments(orderId: string): Promise<OrderCommentModel[]>;
  getOrderLogs(orderId: string): Promise<OrderLogModel[]>;
  createOrder(
    customerId: string,
    items: ReturnType<typeof OrderTransformer.toCreateOrderParams>,
    deliveryInfo?: ReturnType<
      typeof OrderTransformer.toCreateOrderDeliveryInfo
    >,
  ): Promise<OrderModel>;
  // updateOrderStatus(
  //   orderId: string,
  //   status: OrderModel["status"],
  // ): Promise<void>;
  updateOrderPaymentStatus(
    orderId: string,
    status: OrderModel["paymentStatus"],
  ): Promise<void>;
  deleteOrder(orderId: string, customerId: string): Promise<void>;
}

export class OrderRepository implements IOrderRepository {
  constructor(
    private db: PrismaClient = dbClient,
    private customerRepository: CustomerRepository = new CustomerRepository(
      this.db,
    ),
  ) {}

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
      throw new DatabaseError(RepositoryFailuresMessages.getAllOrders, {
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
      throw new DatabaseError(RepositoryFailuresMessages.getOrder, {
        operation: "getOrder",
        orderId: id,
        error,
      });
    }
  }

  async getOrderComments(orderId: string) {
    try {
      return await this.db.orderComment.findMany({
        where: { orderId },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.getOrderComments, {
        operation: "getOrderComments",
        orderId,
        error,
      });
    }
  }

  async getOrderLogs(orderId: string) {
    try {
      return await this.db.orderLog.findMany({
        where: {
          orderId: {
            equals: orderId,
            mode: "insensitive",
          },
        },
      });
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.getOrderLogs, {
        operation: "getOrderLogs",
        orderId,
        error,
      });
    }
  }

  async getCountMetadata(orderId: string) {
    type OrderAggregatesRow = {
      order_id: string; // orders.id is String -> PostgreSQL text -> JS string
      comment_count: bigint;
      log_count: bigint;
      item_count: bigint;
    };

    function convertBigIntToString(
      value: OrderAggregatesRow[keyof Omit<OrderAggregatesRow, "order_id">],
    ): string {
      return typeof value === "bigint" ? `${value}` : value;
    }

    try {
      const c = await this.db.$queryRaw<OrderAggregatesRow[]>`SELECT
                  o.id AS order_id,
                  COUNT(DISTINCT oc.id) AS comment_count,
                  COUNT(DISTINCT ol.id) AS log_count,
                  COUNT(DISTINCT oi.id) AS item_count
              FROM orders AS o
              LEFT JOIN order_comments AS oc ON oc.order_id = o.id
              LEFT JOIN order_logs AS ol ON ol.order_id = o.id
              LEFT JOIN ordered_items AS oi ON oi.order_id = o.id
              WHERE o.id = ${orderId}
              GROUP BY o.id
              ORDER BY o.id;`;

      return c.map((row) => ({
        ...row,
        comment_count: convertBigIntToString(row.comment_count),
        log_count: convertBigIntToString(row.log_count),
        item_count: convertBigIntToString(row.item_count),
      }));
    } catch (error) {
      throw new DatabaseError("Failed to retrieve the order count metadata", {
        operation: "getCountMetadata",
        orderId,
        error,
      });
    }
  }

  async createOrder(
    customerId: string,
    items: ReturnType<typeof OrderTransformer.toCreateOrderParams>,
    deliveryInfo?: ReturnType<
      typeof OrderTransformer.toCreateOrderDeliveryInfo
    >,
  ) {
    try {
      const customer = await this.customerRepository.getCustomer(customerId);

      if (!customer)
        throw new DatabaseError(RepositoryFailuresMessages.createOrder, {
          operation: "createOrder",
          customerId,
        });

      return await this.db.order.create({
        data: {
          id: "OA" + shortNanoid(),
          items: {
            create: items.map((item) => ({
              itemId: item.itemId,
              quantity: item.quantity,
            })),
          },
          customer: {
            connect: { id: customer.id },
          },
          deliveryFee: deliveryInfo?.isRequested ? deliveryInfo.fee : null,
        },
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
      throw new DatabaseError(
        error instanceof DatabaseError
          ? RepositoryFailuresMessages.createOrder + ": " + error.message
          : RepositoryFailuresMessages.createOrder,
        {
          operation: "createOrder",
          customerId,
          items,
          deliveryInfo,
          error,
        },
      );
    }
  }

  async updateOrderPaymentStatus(
    orderId: string,
    status: OrderModel["paymentStatus"],
  ) {
    try {
      await this.db.order.update({
        where: { id: orderId },
        data: { paymentStatus: status },
      });
    } catch (error) {
      throw new DatabaseError(
        RepositoryFailuresMessages.updateOrderPaymentStatus,
        {
          operation: "updateOrderPaymentStatus",
          orderId,
          status,
          error,
        },
      );
    }
  }

  async deleteOrder(orderId: string) {
    try {
      await this.db.order.delete({
        where: { id: orderId },
      });
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.deleteOrder, {
        operation: "deleteOrder",
        orderId,
        error,
      });
    }
  }
}

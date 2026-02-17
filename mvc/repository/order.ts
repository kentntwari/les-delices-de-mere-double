import { nanoid, customAlphabet } from "nanoid";
import { Prisma, PrismaClient } from "@prisma/client";

import { db as dbClient } from "../../server/utils/db";

import { DatabaseError } from "../errors.db";
import { CustomerRepository } from "./customer";

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

export const RepositoryFailuresMessages = {
  getAllOrders: "Failed to get all orders from database",
  getOrder: "Failed to get order from database",
  createOrder: "Failed to create order in database",
} as const;

export type TCreateOrderItemParam = Omit<
  OrderedItemModel,
  "id" | "orderId" | "item"
> & {
  itemId: string;
  itemUnitPrice: number;
};

export type TCreateOrderDeliveryInfo = {
  isRequested: boolean;
  fee: number | null;
};
interface IOrderRepository {
  getAllOrders(): Promise<OrderModel[]>;
  getOrder(id: string): Promise<OrderModel | null>;
  // createOrder(
  //   customerId: string,
  //   items: TCreateOrderItemParam[],
  //   deliveryInfo?: { isRequested: boolean; fee: number },
  // ): Promise<OrderModel>;
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

  async createOrder(
    customerId: string,
    items: TCreateOrderItemParam[],
    deliveryInfo?: { isRequested: boolean; fee: number | null },
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
}

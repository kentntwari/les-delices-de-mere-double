import type { TCreateOrderFormSchema } from "../../shared/utils/schemas.zod";
import type { IBaseRepository } from "./base";

import { customAlphabet } from "nanoid";
import { Prisma, PrismaClient } from "@prisma/client";

import { db as dbClient } from "../../server/utils/db";

import { CustomerRepository } from "./customer";
import { DeliveryRepository } from "./delivery";

import { OrderTransformer } from "../transformers/order";

import { DatabaseError } from "../errors.db";
import { ApplicationError } from "../errors.appwide";

const numericalAlphabet = "0123456789";
const shortNanoid = customAlphabet(numericalAlphabet, 5);

export type OrderModel = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        item: {
          select: {
            id: true;
            title: true;
            unitPrice: true;
          };
        };
      };
    };
  };
}>;

export type OrderItemModel = Prisma.OrderItemGetPayload<{
  omit: {
    itemId: true;
    createdAt: true;
    updatedAt: true;
  };
  include: {
    item: { select: { id: true; title: true; slug: true; unitPrice: true } };
  };
}>;

export type OrderCommentModel = Prisma.OrderCommentGetPayload<{}> & {
  user_name: string | null;
};

export type OrderLogModel = Prisma.OrderLogGetPayload<{}>;

export const RepositoryFailuresMessages = {
  getAll: "Failed to get all orders from database",
  getOrder: "Failed to get order from database",
  createOrder: "Failed to create order in database",
  updateOrder: "Failed to update order in database",
  deleteOrder: "Failed to delete order from database",
  getComments: "Failed to get order comments from database",
  getLogs: "Failed to get order logs from database",
  updateStatus: "Failed to update order status in database",
  updatePaymentStatus: "Failed to update order payment status in database",
} as const;

export interface IOrderRepository extends IBaseRepository<OrderModel> {
  getComments(orderId: string): Promise<OrderCommentModel[]>;
  createComment(
    orderId: string,
    comment: string,
    userId: string,
  ): Promise<OrderCommentModel>;
  getLogs(orderId: string): Promise<OrderLogModel[]>;
  getDeliveryDetails(
    orderId: string,
  ): ReturnType<DeliveryRepository["getOrderDeliveryDetails"]>;
  updateStatus(orderId: string, status: OrderModel["status"]): Promise<void>;
  updatePaymentStatus(
    orderId: string,
    status: OrderModel["paymentStatus"],
  ): Promise<void>;
}

export class OrderRepository implements IOrderRepository {
  constructor(
    private db: PrismaClient = dbClient,
    private customerRepository: CustomerRepository = new CustomerRepository(
      this.db,
    ),
    private deliveryRepository: DeliveryRepository = new DeliveryRepository(
      this.db,
    ),
  ) {}

  async getAll() {
    try {
      return await this.db.order.findMany({
        include: {
          items: {
            include: {
              item: {
                select: {
                  id: true,
                  title: true,
                  unitPrice: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.getAll, {
        operation: "getAll",
        error,
      });
    }
  }

  async get(id: string): Promise<OrderModel | null> {
    try {
      return await this.db.order.findFirst({
        where: { id: { equals: id, mode: "insensitive" } },
        include: {
          items: {
            include: {
              item: {
                select: {
                  id: true,
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

  async getComments(orderId: string): Promise<OrderCommentModel[]> {
    try {
      const raw = await this.db.orderComment.findMany({
        where: { orderId },
        orderBy: { createdAt: "asc" },
        take: 10,
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      return raw.map((c) => ({ ...c, user_name: c.user?.name ?? null }));
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.getComments, {
        operation: "getComments",
        orderId,
        error,
      });
    }
  }

  async getCommentsWithDetails(orderId: string): Promise<OrderCommentModel[]> {
    try {
      const comments = await this.db.orderComment.findMany({
        where: { orderId: { equals: orderId, mode: "insensitive" } },
        include: {
          user: true,
        },
      });
      return comments.map((c) => ({ ...c, user_name: c.user?.name ?? null }));
    } catch (error) {
      throw new DatabaseError("Failed to retrieve comment details", {
        operation: "getCommentDetails",
        error,
      });
    }
  }

  async createComment(
    orderId: string,
    userId: string,
    comment: string,
  ): Promise<OrderCommentModel> {
    try {
      const model = await this.db.orderComment.create({
        data: {
          comment,
          order: {
            connect: { id: orderId.toLocaleUpperCase() },
          },
          user: {
            connect: { id: userId },
          },
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      return { ...model, user_name: model.user?.name ?? null };
    } catch (error) {
      throw new DatabaseError("Failed to create order comment in database", {
        operation: "createComment",
        orderId,
        error,
      });
    }
  }

  async getLogs(orderId: string) {
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
      throw new DatabaseError(RepositoryFailuresMessages.getLogs, {
        operation: "getLogs",
        orderId,
        error,
      });
    }
  }

  async getDeliveryDetails(
    orderId: string,
  ): ReturnType<DeliveryRepository["getOrderDeliveryDetails"]> {
    try {
      return await this.deliveryRepository.getOrderDeliveryDetails(orderId);
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.getOrder, {
        operation: "getDeliveryDetails",
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
                (
                  SELECT COUNT(*)
                  FROM order_comments AS oc
                  WHERE oc.order_id = o.id
                ) AS comment_count,
                (
                  SELECT COUNT(*)
                  FROM order_logs AS ol
                  WHERE ol.order_id = o.id
                ) AS log_count,
                (
                  SELECT COUNT(*)
                  FROM order_items AS oi
                  WHERE oi.order_id = o.id
                ) AS item_count
              FROM orders AS o
              WHERE o.id = ${orderId}
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

  async getCustomerIdFromOrderId(orderId: string) {
    try {
      const o = await this.db.order.findFirst({
        where: { id: { equals: orderId, mode: "insensitive" } },
        select: {
          customer: {
            select: {
              id: true,
            },
          },
        },
      });

      return o?.customer?.id || null;
    } catch (error) {
      throw new DatabaseError("Failed to retrieve customer from order", {
        operation: "getCustomerIdFromOrderId",
        orderId,
        error,
      });
    }
  }

  async getTimeline(orderId: string) {
    try {
      return await this.db.order.findFirstOrThrow({
        where: { id: { equals: orderId, mode: "insensitive" } },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to retrieve order timeline data", {
        operation: "getOrderTimeline",
        orderId,
        error,
      });
    }
  }

  async getPreview(orderId: string) {
    try {
      return await this.db.order.findFirst({
        where: { id: { equals: orderId, mode: "insensitive" } },
        omit: { deliveryAddressId: true, customerId: true },
        include: {
          items: {
            omit: {
              orderId: true,
              itemId: true,
              createdAt: true,
              updatedAt: true,
            },
            include: {
              item: {
                select: { id: true, title: true, unitPrice: true, slug: true },
              },
            },
          },
          customer: {
            select: { id: true, name: true },
          },
          orderComments: {
            take: 10,
            orderBy: { createdAt: "asc" },
            omit: {
              likedBy: true,
              orderId: true,
              userId: true,
              taggedUserId: true,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          logs: {
            take: 10,
            orderBy: { createdAt: "asc" },
            omit: { orderId: true },
          },
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to retrieve order preview data", {
        operation: "getPreview",
        orderId,
        error,
      });
    }
  }

  async create(
    customerId: string,
    items: ReturnType<typeof OrderTransformer.toCreateParams>,
    deliveryInfo?: TCreateOrderFormSchema["delivery"],
  ) {
    let scopedDeliveryRepoWithComputedStates: DeliveryRepository;
    let scopedTxBoundCustomerRepo: CustomerRepository;

    try {
      if (deliveryInfo?.isRequired && !deliveryInfo.address)
        throw new DatabaseError(RepositoryFailuresMessages.createOrder, {
          operation: "create",
          customerId,
          error:
            "Delivery info is marked as required but no delivery address provided",
        });

      const customer = await this.customerRepository.getCustomer(customerId);

      if (!customer)
        throw new DatabaseError(RepositoryFailuresMessages.createOrder, {
          operation: "create",
          customerId,
          error: "Customer not found",
        });

      return await this.db.$transaction(async (tx) => {
        if (deliveryInfo?.isRequired && deliveryInfo.address)
          scopedDeliveryRepoWithComputedStates =
            await DeliveryRepository.create(tx, {
              addressInfo: {
                ...deliveryInfo.address,
                state: deliveryInfo.address.province,
              },
              customerId,
            });

        const oid = "OA" + shortNanoid();
        const o = await tx.order.create({
          data: {
            id: oid,
            items: {
              create: items.map((item) => ({
                itemId: item.itemId,
                quantity: item.quantity,
              })),
            },
            customer: {
              connect: {
                id: customer.id,
              },
            },
            ...(deliveryInfo?.isRequired
              ? {
                  deliveryFee: deliveryInfo.minimumFee || 10,
                  deliveryAddress: {
                    create: {
                      orderId: oid,
                    },
                  },
                }
              : {
                  deliveryFee: 0,
                }),
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

        if (!deliveryInfo?.isRequired) return o;

        scopedTxBoundCustomerRepo = new CustomerRepository(tx);

        switch (true) {
          case scopedDeliveryRepoWithComputedStates.matchesCustomerHomeAddress:
            await scopedDeliveryRepoWithComputedStates.assignAddressToOrder(
              o.id,
              customer.homeAddressId!,
              undefined,
            );
            break;

          case !scopedDeliveryRepoWithComputedStates.matchesCustomerHomeAddress &&
            deliveryInfo.address!.isHomeAddress:
            const updatedCx =
              await scopedTxBoundCustomerRepo.updateCustomerAddress(
                customerId,
                {
                  street: deliveryInfo.address!.street,
                  city: deliveryInfo.address!.city,
                  state: deliveryInfo.address!.province,
                  postalCode: deliveryInfo.address!.postalCode,
                  country: deliveryInfo.address!.country.toUpperCase(),
                },
              );

            await scopedDeliveryRepoWithComputedStates.assignAddressToOrder(
              o.id,
              updatedCx.homeAddressId!,
              undefined,
            );
            break;

          case !scopedDeliveryRepoWithComputedStates.matchesCustomerHomeAddress &&
            !deliveryInfo?.address?.isHomeAddress:
            const delivery =
              await scopedDeliveryRepoWithComputedStates.assignAddressToOrder(
                o.id,
                undefined,
                {
                  ...deliveryInfo.address!,
                  state: deliveryInfo.address!.province,
                },
              );

            await scopedDeliveryRepoWithComputedStates.assignDeliveryToCustomer(
              delivery._meta.order?.orderDeliveryId,
              o.id,
              customerId,
            );
            break;

          default:
            throw new ApplicationError(
              "Unhandled case in order creation delivery assignment logic",
              {
                operation: "create",
                customerId,
                deliveryInfo,
              },
            );
        }

        return o;
      });
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        error instanceof DatabaseError
          ? RepositoryFailuresMessages.createOrder + ": " + error.message
          : RepositoryFailuresMessages.createOrder,
        {
          operation: "create",
          customerId,
          items,
          deliveryInfo,
          error,
        },
      );
    }
  }

  async update(
    orderId: string,
    data: Omit<ReturnType<typeof OrderTransformer.toUpdateParams>, "id">,
  ) {
    try {
      let scopedDeliveryRepoWithComputedStates: DeliveryRepository;

      let itemsAdded: Omit<OrderItemModel, "item">[] = [];
      let unknownItemsAdded: Omit<OrderItemModel, "item">[] = [];

      const currentOrder = await this.db.order.findUniqueOrThrow({
        where: { id: orderId },
      });

      await Promise.all(
        data.items.map(async (item) => {
          const mi = await this.db.menuItem.findUnique({
            where: { id: item.id },
          });

          if (mi !== null)
            itemsAdded.push({
              id: mi.id,
              orderId,
              quantity: item.quantity,
            });
          else
            unknownItemsAdded.push({
              id: item.id,
              orderId,
              quantity: item.quantity,
            });
        }),
      );

      // TODO: Either keep the logs or add a separate mechanism to log these unknown items for manual review, but don't just silently ignore them
      if (unknownItemsAdded.length > 0) {
        console.log("=========================================");
        console.log(
          "Unknown items found during order update:",
          JSON.stringify(unknownItemsAdded),
        );
        console.log("=========================================");
      }

      return await this.db.$transaction(async (tx) => {
        if (data.deliveryAddress)
          scopedDeliveryRepoWithComputedStates =
            await DeliveryRepository.create(tx, {
              addressInfo: {
                street: data.deliveryAddress.street,
                city: data.deliveryAddress.city,
                state: data.deliveryAddress.province,
                postalCode: data.deliveryAddress.postalCode,
                country: data.deliveryAddress.country.toUpperCase(),
              },
            });

        const r = !data.deliveryAddress
          ? undefined
          : await scopedDeliveryRepoWithComputedStates.confirmAddressInfo(
              data.deliveryAddress.street,
              data.deliveryAddress.city,
              data.deliveryAddress.province,
              data.deliveryAddress.postalCode,
              data.deliveryAddress.country.toUpperCase(),
            );

        await tx.order.update({
          where: { id: orderId },
          data: {
            items: {
              deleteMany: {},
              createMany: {
                data: itemsAdded.map((item) => ({
                  itemId: item.id,
                  quantity: item.quantity,
                })),
              },
            },
            ...(r?.address &&
              currentOrder.deliveryAddressId && {
                deliveryAddress: {
                  where: {
                    id: currentOrder.deliveryAddressId,
                  },
                  update: {
                    deliveryAddress: {
                      connect: {
                        id: r.address.id,
                      },
                    },
                  },
                },
              }),
          },
        });

        const order = await this.get(orderId);

        if (!order)
          throw new DatabaseError(RepositoryFailuresMessages.updateOrder, {
            operation: "update",
            orderId,
            data,
            error:
              "Successfully updated order but failed to retrieve the updated order",
          });

        return order;
      });
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(RepositoryFailuresMessages.updateOrder, {
        operation: "update",
        orderId,
        data,
        error,
      });
    }
  }

  async updateStatus(orderId: string, status: OrderModel["status"]) {
    try {
      await this.db.order.update({
        where: { id: orderId },
        data: { status },
      });
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.updateStatus, {
        operation: "updateStatus",
        orderId,
        status,
        error,
      });
    }
  }

  async updatePaymentStatus(
    orderId: string,
    status: OrderModel["paymentStatus"],
  ) {
    try {
      await this.db.order.update({
        where: { id: orderId },
        data: { paymentStatus: status },
      });
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.updatePaymentStatus, {
        operation: "updatePaymentStatus",
        orderId,
        status,
        error,
      });
    }
  }

  async delete(orderId: string) {
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

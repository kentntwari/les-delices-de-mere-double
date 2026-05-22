import { BaseService } from "./base";
import { OrderRepository, type OrderModel } from "../repository/order";
import { OrderMapper } from "../mapper/order";
import { OrderLogsRepository } from "../repository/logs";
import { OrderTransformer } from "../transformers/order";
import { createLogger } from "../../server/utils/logger";
import { ApplicationError } from "../errors.appwide";
import { OrderFactory } from "../factories/order";
import { tryHealthCheck } from "../../server/utils/db";
import { CustomerService } from "./customer";
import { UserService } from "./user";

const log = createLogger("mvc.service.order");

export const ServiceFailuresMessages = {
  getUser: "User not found",
  listOrders: "Failed to list orders",
  createOrder: "Failed to create order",
} as const;

export class OrderService extends BaseService {
  protected author: string | null = null;

  constructor(
    private repository: OrderRepository = new OrderRepository(),
    private logsRepo: OrderLogsRepository = new OrderLogsRepository(),
    private factory: OrderFactory = new OrderFactory(),
    private mapper: OrderMapper = new OrderMapper(),
    private cxService: CustomerService = new CustomerService(),
    private userService: UserService = new UserService(),
  ) {
    super();
    tryHealthCheck();
  }

  defineAuthor(userId: string) {
    this.userService
      .readUser(userId)
      .then((user) => {
        if (!user)
          log.warn(
            {
              userId,
            },
            "User not found during defineAuthor - defaulting to 'system' for order logs",
          );
        else this.author = user.fullName;
      })
      .catch((error) => {
        throw new ApplicationError(ServiceFailuresMessages.getUser, {
          operation: "service.order.defineAuthor",
          userId,
          error,
        });
      });

    return this;
  }

  async read(orderId: string) {
    const order = await this.repository.get(orderId);
    if (!order)
      throw new ApplicationError("Order not found", {
        operation: "service.order.read",
        orderId,
      });

    return order;
  }

  async resolveCustomerForOrder(orderId: string) {
    try {
      const customerId =
        await this.repository.getCustomerIdFromOrderId(orderId);

      if (!customerId)
        throw new ApplicationError("Customer not found for order", {
          operation: "service.order.resolveCustomerForOrder",
          orderId,
        });

      return { customer: customerId };
    } catch (error) {
      this.defaultMapError(error, "service.order.resolveCustomerForOrder");
      throw error;
    }
  }

  private _ensureItemIdPresence(orderItem: OrderModel["items"][number]) {
    if (!orderItem.itemId && !orderItem?.item?.id)
      throw new ApplicationError("Invalid Item Id", {
        operation: "_ensureItemIdPresence",
        orderItem,
        error:
          "Expected itemId to be present for order item but instead received" +
          JSON.stringify(orderItem.itemId),
      });
  }

  async listAll() {
    try {
      const model = await this.repository.getAll();

      for (const order of model)
        for (const item of order.items) this._ensureItemIdPresence(item);

      return this.mapper.toEntityList(model);
    } catch (error) {
      this.defaultMapError(error, "service.order.listAll");
      throw error;
    }
  }

  async listComments(orderId: string) {
    try {
      const model = await this.repository.getComments(orderId);
      return this.mapper.toCommentEntityList(model);
    } catch (error) {
      this.defaultMapError(error, "service.order.listComments");
      throw error;
    }
  }

  async listLogs(orderId: string) {
    try {
      const model = await this.repository.getLogs(orderId);
      return this.mapper.toLogEntityList(model);
    } catch (error) {
      this.defaultMapError(error, "service.order.listLogs");
      throw error;
    }
  }

  async listCountMetadata(orderId: string) {
    try {
      const model = await this.repository.getCountMetadata(orderId);
      return OrderTransformer.toCountMetadata(model);
    } catch (error) {
      throw new ApplicationError("Failed to retrieve order count metadata", {
        operation: "service.order.listCountMetadata",
        orderId,
        error,
      });
    }
  }

  async listDeliveryDetails(orderId: string) {
    try {
      const d = await this.repository.getDeliveryDetails(orderId);

      return OrderTransformer.toDeliveryDetails(d);
    } catch (error) {
      throw new ApplicationError("Failed to retrieve order delivery details", {
        operation: "service.order.listDeliveryDetails",
        orderId,
        error,
      });
    }
  }

  async create(data: unknown) {
    let orderId: string | null = null;
    let isOrderCreated = false;

    try {
      const { cx, items, delivery } = this.factory.validateCreateOrder(data);

      const currentCX = await this.cxService.readOrCreateCustomer({
        ...cx,
        id: cx.id ?? undefined,
        ...(delivery.address &&
          delivery.address.isHomeAddress && {
            address: {
              street: delivery.address.street,
              city: delivery.address.city,
              province: delivery.address.province,
              postalCode: delivery.address.postalCode,
              country: delivery.address.country,
            },
          }),
      });

      if (!currentCX)
        throw new ApplicationError(ServiceFailuresMessages.createOrder, {
          operation: "service.order.create",
          customerId: cx.id,
          error: "Customer not found",
        });

      const order = await this.repository.create(
        currentCX.id,
        OrderTransformer.toCreateOrderParams(items),
        delivery,
      );

      isOrderCreated = true;
      orderId = order.id;

      return this.mapper.toEntity(order);
    } catch (error) {
      this.defaultMapError(error, "service.order.create");
      throw error;
    } finally {
      if (isOrderCreated && orderId)
        await this.logsRepo
          .createLog(
            orderId,
            OrderLogsRepository.createOrderLogMessage(
              new Date().toISOString(),
              this.author || "system",
            ),
          )
          .catch((logError) => {
            log.error(
              {
                err: logError,
                operation: "service.order.create - createLog",
                orderId,
              },
              "Failed to create order log (best-effort)",
            );
          });
    }
  }

  async update(data: unknown) {
    try {
      const { id, items, delivery } = this.factory.validateUpdateOrder(data);
      const order = await this.repository.update(
        id,
        OrderTransformer.toOrderUpdateParams({ id, items, delivery }),
      );
      return this.mapper.toEntity(order);
    } catch (error) {
      this.defaultMapError(error, "service.order.update");
      throw error;
    }
  }

  async delete(orderId: string) {
    let isDeleted: boolean = false;

    try {
      await this.repository.delete(orderId);
      isDeleted = true;
    } catch (error) {
      this.defaultMapError(error, "service.order.delete");
      throw error;
    } finally {
      if (isDeleted)
        await this.logsRepo
          .createLog(
            orderId,
            OrderLogsRepository.deleteOrderLogMessage(
              new Date().toISOString(),
              this.author || "system",
            ),
          )
          .catch((logError) => {
            log.error(
              {
                err: logError,
                operation: "service.order.delete - createLog",
                orderId,
              },
              "Failed to create order log (best-effort)",
            );
          });
    }
  }

  async updateStatus(status: OrderModel["status"], orderId: string) {
    let isUpdated: boolean = false;

    try {
      const o = await this.read(orderId);
      if (o.status === status) return;
      await this.repository.updateStatus(orderId, status);
      isUpdated = true;
    } catch (error) {
      this.defaultMapError(error, "service.order.updateStatus");
      throw error;
    } finally {
      if (isUpdated)
        await this.logsRepo
          .createLog(
            orderId,
            OrderLogsRepository.updateStatusLogMessage(
              status,
              new Date().toISOString(),
              this.author || "system",
            ),
          )
          .catch((logError) => {
            log.error(
              {
                err: logError,
                operation: "service.order.updateStatus - createLog",
                orderId,
              },
              "Failed to create order log (best-effort)",
            );
          });
    }
  }

  async updatePaymentStatus(
    status: OrderModel["paymentStatus"],
    orderId: string,
  ) {
    let isUpdated: boolean = false;

    try {
      const o = await this.read(orderId);
      if (o.paymentStatus === status) return;
      await this.repository.updatePaymentStatus(orderId, status);

      isUpdated = true;
    } catch (error) {
      this.defaultMapError(error, "service.order.updatePaymentStatus");
      throw error;
    } finally {
      if (isUpdated)
        await this.logsRepo
          .createLog(
            orderId,
            OrderLogsRepository.updatePaymentStatusLogMessage(
              status,
              new Date().toISOString(),
              this.author || "system",
            ),
          )
          .catch((logError) => {
            log.error(
              {
                err: logError,
                operation: "service.order.updatePaymentStatus - createLog",
                orderId,
              },
              "Failed to create order log (best-effort)",
            );
          });
    }
  }
}

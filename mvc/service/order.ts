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

  async listAll() {
    try {
      const model = await this.repository.getAllOrders();
      return this.mapper.toEntityList(model);
    } catch (error) {
      this.defaultMapError(error, "service.order.listAll");
      throw error;
    }
  }

  async listComments(orderId: string) {
    try {
      const model = await this.repository.getOrderComments(orderId);
      return this.mapper.toCommentEntityList(model);
    } catch (error) {
      this.defaultMapError(error, "service.order.listComments");
      throw error;
    }
  }

  async listLogs(orderId: string) {
    try {
      const model = await this.repository.getOrderLogs(orderId);
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

  async create(data: unknown) {
    let orderId: string | null = null;
    let orderTimeStamp: string | null = null;
    let isOrderCreated = false;

    try {
      tryHealthCheck();

      const { cx, items, delivery } = this.factory.validateCreateOrder(data);

      const currentCX = await this.cxService.getOrCreateCustomer({
        ...cx,
        id: cx.id ?? undefined,
      });

      if (!currentCX)
        throw new ApplicationError(ServiceFailuresMessages.createOrder, {
          operation: "service.order.create",
          customerId: cx.id,
          error: "Customer not found",
        });

      const order = await this.repository.createOrder(
        currentCX.id,
        OrderTransformer.toCreateOrderParams(items),
        OrderTransformer.toCreateOrderDeliveryInfo(delivery),
      );

      isOrderCreated = true;
      orderId = order.id;
      orderTimeStamp = order.createdAt.toISOString();

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
              orderTimeStamp || new Date().toISOString(),
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

  async updatePaymentStatus(
    status: OrderModel["paymentStatus"],
    orderId: string,
    userId: string,
  ) {
    let isUpdated: boolean = false;

    let orderTimeStamp: string | null = null;

    try {
      tryHealthCheck();

      const user = await this.userService.readUser(userId);

      if (!user)
        log.warn(
          {
            userId,
          },
          "User not found during updatePaymentStatus - defaulting to 'system' for order logs",
        );
      const o = await this.repository.getOrder(orderId);
      if (!o)
        throw new ApplicationError("Order not found", {
          operation: "service.order.updatePaymentStatus",
          orderId,
        });
      else if (o.paymentStatus === status) return;
      else await this.repository.updateOrderPaymentStatus(orderId, status);

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
              orderTimeStamp || new Date().toISOString(),
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

  async delete(orderId: string) {
    let isDeleted: boolean = false;
    let deletionTimeStamp: string | null = null;

    try {
      tryHealthCheck();

      await this.repository.deleteOrder(orderId);
      isDeleted = true;
      deletionTimeStamp = new Date().toISOString();
    } catch (error) {
      this.defaultMapError(error, "service.order.deleteOrder");
      throw error;
    } finally {
      if (isDeleted)
        await this.logsRepo
          .createLog(
            orderId,
            OrderLogsRepository.deleteOrderLogMessage(
              deletionTimeStamp || new Date().toISOString(),
              this.author || "system",
            ),
          )
          .catch((logError) => {
            log.error(
              {
                err: logError,
                operation: "service.order.deleteOrder - createLog",
                orderId,
              },
              "Failed to create order log (best-effort)",
            );
          });
    }
  }
}

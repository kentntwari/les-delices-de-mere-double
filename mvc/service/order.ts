import { BaseService } from "./base";
import { OrderRepository } from "../repository/order";
import { OrderMapper } from "../mapper/order";
import { OrderLogsRepository } from "../repository/logs";
import { createLogger } from "../../server/utils/logger";
import { ApplicationError } from "../errors.appwide";
import { OrderFactory } from "../factories/order";
import { tryHealthCheck } from "../../server/utils/db";
import { CustomerService } from "./customer";

const log = createLogger("mvc.service.order");

export const ServiceFailuresMessages = {
  listOrders: "Failed to list orders",
  createOrder: "Failed to create order",
} as const;

export class OrderService extends BaseService {
  constructor(
    private repository: OrderRepository = new OrderRepository(),
    private logsRepo: OrderLogsRepository = new OrderLogsRepository(),
    private factory: OrderFactory = new OrderFactory(),
    private mapper: OrderMapper = new OrderMapper(),
    private cxService: CustomerService = new CustomerService(),
  ) {
    super();
  }

  async listOrders() {
    try {
      const model = await this.repository.getAllOrders();
      return this.mapper.toEntityList(model);
    } catch (error) {
      this.defaultMapError(error, "service.order.listOrders");
      throw error;
    }
  }

  async createOrder(data: unknown) {
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
          operation: "createOrder",
          customerId: cx.id,
          error: "Customer not found",
        });

      const order = await this.repository.createOrder(
        currentCX.id,
        this.mapper.toCreateOrderItems(items),
        this.mapper.toDeliveryInfo(delivery),
      );

      isOrderCreated = true;
      orderId = order.id;
      orderTimeStamp = order.createdAt.toISOString();

      return this.mapper.toEntity(order);
    } catch (error) {
      this.defaultMapError(error, "service.order.createOrder");
      throw error;
    } finally {
      if (isOrderCreated && orderId)
        await this.logsRepo
          .createLog(
            orderId,
            OrderLogsRepository.createOrderLogMessage(
              orderTimeStamp || new Date().toISOString(),
              "system",
            ),
          )
          .catch((logError) => {
            log.error(
              {
                err: logError,
                operation: "service.order.createOrder - createLog",
                orderId,
              },
              "Failed to create order log (best-effort)",
            );
          });
    }
  }
}

import { BaseService } from "./base";

import { OrderRepository } from "../repository/order";
import { OrderMapper } from "../mapper/order";

export class OrderService extends BaseService {
  constructor(
    private repository: OrderRepository = new OrderRepository(),
    private mapper: OrderMapper = new OrderMapper()
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
}

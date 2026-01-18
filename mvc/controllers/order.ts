import {
  BadRequestResponse,
  BaseController,
  JsonResponse,
  ForbiddenResponse,
} from "./base";

import { OrderService } from "../service/order";
import { OrderMapper } from "../mapper/order";

export class OrderController extends BaseController {
  constructor(
    req: Request,
    private service: OrderService = new OrderService(),
    private mapper: OrderMapper = new OrderMapper()
  ) {
    super(req);
  }

  async list() {
    try {
      const orders = await this.service.listOrders();
      return new JsonResponse({
        data: this.mapper.toDtoList(orders),
      });
    } catch (error) {
      this.logError(error, {
        origin: "controllers.order.list",
      });
      return this.mapErrorResponse(error, {
        origin: "controllers.order.list",
      });
    }
  }

  async read() {
    return new BadRequestResponse("Not implemented yet");
  }

  async create(args: any) {
    return new BadRequestResponse("Not implemented yet");
  }

  async update(args: any) {
    return new BadRequestResponse("Not implemented yet");
  }

  async delete(args: any) {
    return new BadRequestResponse("Not implemented yet");
  }
}

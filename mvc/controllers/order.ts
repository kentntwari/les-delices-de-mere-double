import {
  BadRequestResponse,
  BaseController,
  JsonResponse,
  SilentSuccessResponse,
} from "./base";

import { OrderService } from "../service/order";
import { OrderMapper } from "../mapper/order";

import { type THandleOrderIntentsSchema } from "../../shared/utils/schemas.zod";

export class OrderController extends BaseController {
  protected originator_user_id: string = "UNKNOWN_USER_ID";

  constructor(
    req: Request,
    private service: OrderService = new OrderService(),
    private mapper: OrderMapper = new OrderMapper(),
  ) {
    super(req);
  }

  promoteUserId(id: string): Omit<this, "promoteUserId"> {
    this.originator_user_id = id;
    return this;
  }

  async list() {
    try {
      const orders = await this.service.listAll();
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

  async create() {
    try {
      await this.service
        .defineAuthor(this.originator_user_id)
        .create(await this.getBody());
      return new SilentSuccessResponse();
    } catch (error) {
      this.logError(error, {
        origin: "controllers.order.create",
      });
      return this.mapErrorResponse(error, {
        origin: "controllers.order.create",
      });
    }
  }

  async update(args: any) {
    return new BadRequestResponse("Not implemented yet");
  }

  async delete(orderId: string) {
    try {
      await this.service.defineAuthor(this.originator_user_id).delete(orderId);
      return new SilentSuccessResponse();
    } catch (error) {
      this.logError(error, {
        origin: "controllers.order.delete",
        orderId,
      });

      return this.mapErrorResponse(error, {
        origin: "controllers.order.delete",
        orderId,
      });
    }
  }

  async handleIntent(intent: THandleOrderIntentsSchema, orderId: string) {
    switch (intent) {
      case "get-comments": {
        try {
          const comments = await this.service.listComments(orderId);
          return new JsonResponse({
            data: this.mapper.toCommentDtoList(comments),
          });
        } catch (error) {
          this.logError(error, {
            origin: "controllers.order.handleIntent.get-comments",
            orderId,
          });
          return this.mapErrorResponse(error, {
            origin: "controllers.order.handleIntent.get-comments",
          });
        }
      }

      case "get-logs": {
        try {
          const logs = await this.service.listLogs(orderId);
          return new JsonResponse({
            data: this.mapper.toLogDtoList(logs),
          });
        } catch (error) {
          this.logError(error, {
            origin: "controllers.order.handleIntent.get-logs",
            orderId,
          });
          return this.mapErrorResponse(error, {
            origin: "controllers.order.handleIntent.get-logs",
          });
        }
      }

      case "mark-as-paid": {
        try {
          await this.service
            .defineAuthor(this.originator_user_id)
            .updatePaymentStatus("PAID", orderId, this.originator_user_id);
          return new SilentSuccessResponse();
        } catch (error) {
          this.logError(error, {
            origin: "controllers.order.handleIntent.mark-as-paid",
            orderId,
          });
          return this.mapErrorResponse(error, {
            origin: "controllers.order.handleIntent.mark-as-paid",
          });
        }
      }

      case "revert-to-unpaid": {
        try {
          await this.service
            .defineAuthor(this.originator_user_id)
            .updatePaymentStatus("UNPAID", orderId, this.originator_user_id);
          return new SilentSuccessResponse();
        } catch (error) {
          this.logError(error, {
            origin: "controllers.order.handleIntent.revert-to-unpaid",
            orderId,
          });
          return this.mapErrorResponse(error, {
            origin: "controllers.order.handleIntent.revert-to-unpaid",
            orderId,
          });
        }
      }

      case "get-order-count-metadata": {
        try {
          const metadata = await this.service.listCountMetadata(orderId);
          return new JsonResponse({
            data: metadata,
          });
        } catch (error) {
          this.logError(error, {
            origin: "controllers.order.handleIntent.get-order-count-metadata",
            orderId,
          });
          return this.mapErrorResponse(error, {
            origin: "controllers.order.handleIntent.get-order-count-metadata",
          });
        }
      }

      default:
        return new BadRequestResponse("Unrecognized intent");
    }
  }
}

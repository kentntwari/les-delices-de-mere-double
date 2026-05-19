import { type THandleOrderIntentsSchema } from "../../shared/utils/schemas.zod";

import {
  BadRequestResponse,
  BaseController,
  InternalServerErrorResponse,
  JsonResponse,
  SilentSuccessResponse,
} from "./base";

import { OrderService } from "../service/order";
import {
  OrderMapper,
  type TOrderCommentDTO,
  type TOrderDTO,
  type TOrderLogDTO,
} from "../mapper/order";
import { OrderTransformer } from "../transformers/order";

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

  async update() {
    try {
      // INFO: No logging here hence we don't include the author
      const o = await this.service.update(await this.getBody());
      return new JsonResponse({
        data: this.mapper.toDto(o),
      });
    } catch (error) {
      this.logError(error, {
        origin: "controllers.order.update",
      });
      return this.mapErrorResponse(error, {
        origin: "controllers.order.update",
      });
    }
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

  async handleIntent(
    intent: "update-order",
    orderId: string,
  ): Promise<
    | JsonResponse<{ data: TOrderDTO }>
    | BadRequestResponse
    | InternalServerErrorResponse
  >;
  async handleIntent(
    intent: "get-comments",
    orderId: string,
  ): Promise<
    | JsonResponse<{ data: TOrderCommentDTO[] }>
    | BadRequestResponse
    | InternalServerErrorResponse
  >;
  async handleIntent(
    intent: "get-logs",
    orderId: string,
  ): Promise<
    | JsonResponse<{ data: TOrderLogDTO[] }>
    | BadRequestResponse
    | InternalServerErrorResponse
  >;
  async handleIntent(
    intent: "get-order-customer",
    orderId: string,
  ): Promise<
    | JsonResponse<{ data: { id: string } }>
    | BadRequestResponse
    | InternalServerErrorResponse
  >;
  async handleIntent(
    intent: "get-order-count-metadata",
    orderId: string,
  ): Promise<
    | JsonResponse<{
        data: ReturnType<typeof OrderTransformer.toCountMetadata>;
      }>
    | BadRequestResponse
    | InternalServerErrorResponse
  >;
  async handleIntent(
    intent: "get-order-delivery-details",
    orderId: string,
  ): Promise<
    | JsonResponse<{
        data: ReturnType<typeof OrderTransformer.toDeliveryDetails>;
      }>
    | BadRequestResponse
    | InternalServerErrorResponse
  >;
  async handleIntent(
    intent: "mark-as-paid",
    orderId: string,
  ): Promise<
    SilentSuccessResponse | BadRequestResponse | InternalServerErrorResponse
  >;
  async handleIntent(
    intent: "mark-as-unpaid",
    orderId: string,
  ): Promise<
    SilentSuccessResponse | BadRequestResponse | InternalServerErrorResponse
  >;
  async handleIntent(
    intent: "mark-as-not-started",
    orderId: string,
  ): Promise<
    SilentSuccessResponse | BadRequestResponse | InternalServerErrorResponse
  >;
  async handleIntent(
    intent: "mark-as-in-progress",
    orderId: string,
  ): Promise<
    SilentSuccessResponse | BadRequestResponse | InternalServerErrorResponse
  >;
  async handleIntent(
    intent: "mark-as-completed",
    orderId: string,
  ): Promise<
    SilentSuccessResponse | BadRequestResponse | InternalServerErrorResponse
  >;
  async handleIntent(
    intent: "mark-as-cancelled",
    orderId: string,
  ): Promise<
    SilentSuccessResponse | BadRequestResponse | InternalServerErrorResponse
  >;
  async handleIntent(
    intent: THandleOrderIntentsSchema,
    orderId: string,
  ): Promise<
    | JsonResponse<{ data: TOrderDTO }>
    | JsonResponse<{ data: TOrderCommentDTO[] }>
    | JsonResponse<{ data: TOrderLogDTO[] }>
    | JsonResponse<{ data: { id: string } }>
    | JsonResponse<{
        data: ReturnType<typeof OrderTransformer.toCountMetadata>;
      }>
    | JsonResponse<{
        data: ReturnType<typeof OrderTransformer.toDeliveryDetails>;
      }>
    | SilentSuccessResponse
    | BadRequestResponse
    | InternalServerErrorResponse
  >;
  async handleIntent(intent: THandleOrderIntentsSchema, orderId: string) {
    switch (intent) {
      case "update-order": {
        return await this.update();
      }

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
            orderId,
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
            orderId,
          });
        }
      }

      case "mark-as-paid": {
        try {
          await this.service
            .defineAuthor(this.originator_user_id)
            .updatePaymentStatus("PAID", orderId);
          return new SilentSuccessResponse();
        } catch (error) {
          this.logError(error, {
            origin: "controllers.order.handleIntent.mark-as-paid",
            orderId,
          });
          return this.mapErrorResponse(error, {
            origin: "controllers.order.handleIntent.mark-as-paid",
            orderId,
          });
        }
      }

      case "mark-as-unpaid": {
        try {
          await this.service
            .defineAuthor(this.originator_user_id)
            .updatePaymentStatus("UNPAID", orderId);
          return new SilentSuccessResponse();
        } catch (error) {
          this.logError(error, {
            origin: "controllers.order.handleIntent.mark-as-unpaid",
            orderId,
          });
          return this.mapErrorResponse(error, {
            origin: "controllers.order.handleIntent.mark-as-unpaid",
            orderId,
          });
        }
      }

      case "mark-as-not-started": {
        try {
          await this.service
            .defineAuthor(this.originator_user_id)
            .updateStatus("NOT_STARTED", orderId);
          return new SilentSuccessResponse();
        } catch (error) {
          this.logError(error, {
            origin: "controllers.order.handleIntent.mark-as-not-started",
            orderId,
          });
          return this.mapErrorResponse(error, {
            origin: "controllers.order.handleIntent.mark-as-not-started",
            orderId,
          });
        }
      }

      case "mark-as-in-progress": {
        try {
          await this.service
            .defineAuthor(this.originator_user_id)
            .updateStatus("IN_PROGRESS", orderId);
          return new SilentSuccessResponse();
        } catch (error) {
          this.logError(error, {
            origin: "controllers.order.handleIntent.mark-as-in-progress",
            orderId,
          });
          return this.mapErrorResponse(error, {
            origin: "controllers.order.handleIntent.mark-as-in-progress",
            orderId,
          });
        }
      }

      case "mark-as-completed": {
        try {
          await this.service
            .defineAuthor(this.originator_user_id)
            .updateStatus("COMPLETED", orderId);
          return new SilentSuccessResponse();
        } catch (error) {
          this.logError(error, {
            origin: "controllers.order.handleIntent.mark-as-completed",
            orderId,
          });
          return this.mapErrorResponse(error, {
            origin: "controllers.order.handleIntent.mark-as-completed",
            orderId,
          });
        }
      }

      case "mark-as-cancelled": {
        try {
          await this.service
            .defineAuthor(this.originator_user_id)
            .updateStatus("CANCELLED", orderId);
          return new SilentSuccessResponse();
        } catch (error) {
          this.logError(error, {
            origin: "controllers.order.handleIntent.mark-as-cancelled",
            orderId,
          });
          return this.mapErrorResponse(error, {
            origin: "controllers.order.handleIntent.mark-as-cancelled",
            orderId,
          });
        }
      }

      case "get-order-customer": {
        try {
          const result = await this.service.resolveCustomerForOrder(orderId);
          return new JsonResponse({
            data: {
              id: result.customer,
            },
          });
        } catch (error) {
          this.logError(error, {
            origin: "controllers.order.handleIntent.get-order-customer",
            orderId,
          });
          return this.mapErrorResponse(error, {
            origin: "controllers.order.handleIntent.get-order-customer",
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
            orderId,
          });
        }
      }

      case "get-order-delivery-details": {
        try {
          return new JsonResponse({
            data: await this.service.listDeliveryDetails(orderId),
          });
        } catch (error) {
          this.logError(error, {
            origin: "controllers.order.handleIntent.get-order-delivery-details",
            orderId,
          });
          return this.mapErrorResponse(error, {
            origin: "controllers.order.handleIntent.get-order-delivery-details",
            orderId,
          });
        }
      }

      default:
        return new BadRequestResponse("Unrecognized intent");
    }
  }
}

import {
  BadRequestResponse,
  BaseController,
  ForbiddenResponse,
  InternalServerErrorResponse,
  JsonResponse,
  NotFoundResponse,
  SilentSuccessResponse,
} from "./base";
import { OrderCommentService } from "../service/comment";
import {
  OrderCommentMapper,
  type TOrderCommentDTO,
  type TOrderCommentDetailsDTO,
} from "../mapper/comment";
import { UserService } from "../service/user";
import { ApplicationError } from "../errors.appwide";

interface IOrderCommentControllerOptions {
  userService: UserService;
}

export class OrderCommentController extends BaseController {
  protected originator_user_id: string = "UNKNOWN_USER_ID";

  constructor(
    req: Request,
    private service: OrderCommentService = new OrderCommentService(),
    private mapper: OrderCommentMapper = new OrderCommentMapper(),
    private options: IOrderCommentControllerOptions = {
      userService: new UserService(),
    },
  ) {
    super(req);
  }

  promoteUserId(id: string): Omit<this, "promoteUserId"> {
    this.originator_user_id = id;
    return this;
  }

  async list(
    orderId: string,
  ): Promise<
    | JsonResponse<{ data: TOrderCommentDTO[] }>
    | BadRequestResponse
    | NotFoundResponse
    | InternalServerErrorResponse
  > {
    try {
      const comments = await this.service.list(orderId);
      return new JsonResponse({ data: this.mapper.toDtoList(comments) });
    } catch (error) {
      this.logError(error, {
        origin: "controllers.comment.list",
        orderId,
      });
      return this.mapErrorResponse(error, {
        origin: "controllers.comment.list",
        orderId,
      });
    }
  }

  async listDetails(
    orderId: string,
  ): Promise<
    | JsonResponse<{ data: TOrderCommentDetailsDTO[] }>
    | BadRequestResponse
    | NotFoundResponse
    | InternalServerErrorResponse
  > {
    try {
      return new JsonResponse({
        data: await this.service.listDetails(orderId),
      });
    } catch (error) {
      this.logError(error, {
        origin: "controllers.comment.listDetails",
        orderId,
      });
      return this.mapErrorResponse(error, {
        origin: "controllers.comment.listDetails",
        orderId,
      });
    }
  }

  async create(orderId: string) {
    try {
      const user = await this.options.userService.readUser(
        this.originator_user_id,
      );

      if (!user) {
        this.logError(new Error("User not found"), {
          origin: "controllers.comment.create",
          orderId,
          userId: this.originator_user_id,
        });
        return new BadRequestResponse("User not found");
      }

      return new JsonResponse({
        data: await this.service.create(orderId, user.id, await this.getBody()),
      });
    } catch (error) {
      this.logError(error, {
        origin: "controllers.comment.create",
        orderId,
      });
      return this.mapErrorResponse(error, {
        origin: "controllers.comment.create",
        orderId,
      });
    }
  }

  async read(
    orderId: string,
  ): Promise<
    | JsonResponse<{ data: TOrderCommentDetailsDTO[] }>
    | BadRequestResponse
    | NotFoundResponse
    | InternalServerErrorResponse
  > {
    return this.listDetails(orderId);
  }

  async like(orderId: string, commentId: string) {
    try {
      const user = await this.options.userService.readUser(
        this.originator_user_id,
      );

      if (!user) {
        this.logError(new Error("User not found"), {
          origin: "controllers.comment.like",
          orderId,
          commentId,
          userId: this.originator_user_id,
        });
        return new BadRequestResponse("User not found");
      }

      return new JsonResponse({
        data: await this.service.like(orderId, commentId, user.id),
      });
    } catch (error) {
      this.logError(error, {
        origin: "controllers.comment.like",
        orderId,
        commentId,
      });
      return this.mapErrorResponse(error, {
        origin: "controllers.comment.like",
        orderId,
        commentId,
      });
    }
  }

  async delete(
    orderId: string,
    commentId: string,
  ): Promise<
    | SilentSuccessResponse
    | BadRequestResponse
    | ForbiddenResponse
    | NotFoundResponse
    | InternalServerErrorResponse
  > {
    try {
      await this.service.delete(orderId, commentId, this.originator_user_id);
      return new SilentSuccessResponse();
    } catch (error) {
      if (
        error instanceof ApplicationError &&
        error.message === "You are not allowed to delete this comment"
      ) {
        return new ForbiddenResponse(error.message);
      }

      this.logError(error, {
        origin: "controllers.comment.delete",
        orderId,
        commentId,
      });
      return this.mapErrorResponse(error, {
        origin: "controllers.comment.delete",
        orderId,
        commentId,
      });
    }
  }

  async update(): Promise<BadRequestResponse> {
    return new BadRequestResponse("Order comment update is not supported");
  }
}

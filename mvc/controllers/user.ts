import { errorMap } from "../../shared/utils/errorMap";
import { createLogger } from "../../server/utils/logger";
import { UserService } from "../service/user";
import { UserMapper } from "../mapper/user";
import {
  BaseController,
  BadRequestResponse,
  NotFoundResponse,
  JsonResponse,
  SilentSuccessResponse,
  InternalServerErrorResponse,
} from "./base";
import { UserEntity } from "../entities/user";

interface IReadUserArgs {
  userId: string;
  intent?: "GET_STATUS" | "GET_PERMISSIONS";
}

interface IReadUserStatusArgs extends IReadUserArgs {
  intent: "GET_STATUS";
}

interface IReadUserPermissionsArgs extends IReadUserArgs {
  intent: "GET_PERMISSIONS";
}

interface IReadUserDefaultArgs extends IReadUserArgs {
  intent?: undefined;
}

const log = createLogger("mvc.controllers.user");

export class UserController extends BaseController {
  constructor(
    req: Request,
    private service: UserService = new UserService(),
  ) {
    super(req);
  }

  public async create() {
    return new BadRequestResponse("Not implemented");
  }

  public async list() {
    try {
      const users = await this.service.listAll();
      return new JsonResponse({ data: users });
    } catch (error) {
      this.logError(error, {
        origin: "controllers.user.list",
      });
      return this.mapErrorResponse(error, {
        origin: "controllers.user.list",
      });
    }
  }

  public async read(
    args: IReadUserStatusArgs,
  ): Promise<
    | JsonResponse<{ data: UserEntity["status"] }>
    | BadRequestResponse
    | InternalServerErrorResponse
    | NotFoundResponse
  >;
  public async read(
    args: IReadUserPermissionsArgs,
  ): Promise<
    | JsonResponse<{ data: UserEntity["permissions"] }>
    | BadRequestResponse
    | InternalServerErrorResponse
    | NotFoundResponse
  >;
  public async read(
    args: IReadUserDefaultArgs,
  ): Promise<
    | JsonResponse<{ data: ReturnType<UserMapper["toDto"]> }>
    | BadRequestResponse
    | InternalServerErrorResponse
    | NotFoundResponse
  >;
  public async read(args: IReadUserArgs) {
    try {
      const user = await this.service.readUser(args.userId);

      if (!user) return new NotFoundResponse(errorMap.app.user.NOT_FOUND);
      else
        switch (true) {
          case args.intent === "GET_STATUS":
            return new JsonResponse({ data: user.status });

          case args.intent === "GET_PERMISSIONS":
            return new JsonResponse({ data: user.permissions });

          default:
            log.warn(
              { intent: args.intent, userId: args.userId },
              "Invalid intent received",
            );
            return new JsonResponse({ data: new UserMapper().toDto(user) });
        }
    } catch (error) {
      this.logError(error, {
        origin: "controllers.user.read",
        userId: args.userId,
      });
      return this.mapErrorResponse(error, {
        origin: "controllers.user.read",
      });
    }
  }

  public async update() {
    return new BadRequestResponse("Not implemented");
  }

  public async delete() {
    return new BadRequestResponse("Not implemented");
  }
}

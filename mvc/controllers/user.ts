import { errorMap } from "../../shared/utils/errorMap";
import { createLogger } from "../../server/utils/logger";
import { UserService } from "../service/user";
import {
  BaseController,
  BadRequestResponse,
  NotFoundResponse,
  JsonResponse,
  ForbiddenResponse,
} from "./base";

interface IReadUserArgs {
  userId: string;
  intent: "GET_STATUS" | "GET_PERMISSIONS";
}

const log = createLogger("mvc.controllers.user");

export class UserController extends BaseController {
  constructor(req: Request, private service: UserService = new UserService()) {
    super(req);
  }

  public async create() {
    return new BadRequestResponse("Not implemented");
  }

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
              "Invalid intent received"
            );
            return new BadRequestResponse(
              errorMap.app.general.UNABLE_TO_PROCESS
            );
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

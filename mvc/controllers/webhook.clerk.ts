import { type WebhookEvent, verifyWebhook } from "@clerk/backend/webhooks";
import { BadRequestResponse, BaseController, JsonResponse } from "./base";

import { NetworkError } from "../errors.appwide";
import { UserService } from "../service/user";

import { MapperStrategy } from "../mapper/strategy";

const s = {
  user: UserService,
} as const;
export class WebhookClerkController extends BaseController {
  private _webhookEvent: WebhookEvent | null = null;

  constructor(req: Request) {
    super(req);
  }

  protected sanitizeRequest() {
    throw new BadRequestResponse("Not implemented");
  }

  protected async verifyClerkWebhook() {
    try {
      this._webhookEvent = await verifyWebhook(this.req);
      return this._webhookEvent;
    } catch (error) {
      this.logError(error, {
        origin: "controllers.webhook.clerk.verifyClerkWebhook",
      });
      throw new NetworkError("Unable to verify Clerk webhook", {
        source: "controllers.webhook.clerk",
        originalError: error,
      });
    }
  }

  public async read() {
    return new BadRequestResponse("Not implemented");
  }

  public async create() {
    return new BadRequestResponse("Not implemented");
  }

  public async update() {
    return new BadRequestResponse("Not implemented");
  }

  public async delete() {
    return new BadRequestResponse("Not implemented");
  }

  public async handleEvent() {
    try {
      const event = await this.verifyClerkWebhook();

      switch (true) {
        case event.type === "user.created":
          const b = await new UserService().registerUser(
            MapperStrategy.registerUser.fromClerkWebhookEvent(event)
          );

          return new JsonResponse({
            success: true,
            data: MapperStrategy.registerUser.toDto(b),
          });

        default:
          return new BadRequestResponse("Unhandled Clerk webhook event type");
      }
    } catch (error) {
      this.logError(error, {
        origin: "controllers.webhook.clerk.handleEvent",
      });
      return this.mapErrorResponse(error);
    }
  }
}

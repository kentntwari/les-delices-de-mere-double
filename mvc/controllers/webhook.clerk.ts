import { type WebhookEvent, verifyWebhook } from "@clerk/backend/webhooks";
import { BadRequestResponse, BaseController, JsonResponse } from "./base";

import { NetworkError } from "../errors.appwide";
import { UserService } from "../service/user";
import { UserMapper } from "../mapper/user";
import { UserTransformer } from "../transformers/user";

export class WebhookClerkController extends BaseController {
  private _webhookEvent: WebhookEvent | null = null;

  constructor(
    req: Request,
    private service: UserService = new UserService(),
    private mapper: UserMapper = new UserMapper(),
  ) {
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
          // TODO: Should write to clerk metadata for faster processing in policy middleware
          const b = await this.service.registerUser(
            UserTransformer.fromClerkWebhookEvent(event.data),
          );

          return new JsonResponse({
            data: this.mapper.toDto(b),
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

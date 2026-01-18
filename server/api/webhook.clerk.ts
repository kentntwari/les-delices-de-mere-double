import { WebhookClerkController } from "../../mvc/controllers/webhook.clerk";
import { createRequestLogger } from "../utils/logger";
import { treatErrors, treatResponses } from "../utils/responses";
import { errorMap } from "~~/shared/utils/errorMap";

const log = createRequestLogger("/api/webhook.clerk.ts");

export default defineEventHandler(async (event) => {
  try {
    if (event.method === "POST") {
      log.info(
        event.path,
        event.method,
        await readBody(event),
        "POST REQUEST RECEIVED: Handling Clerk webhook event"
      );

      const response = await new WebhookClerkController(
        toWebRequest(event)
      ).handleEvent();

      return treatResponses(event, response, "/api/webhook.clerk.ts");
    } else {
      log.error(
        event.path,
        event.method,
        null,
        "[METHOD NOT ALLOWED]: Only POST requests are allowed"
      );

      throw createError({
        statusCode: 405,
        statusMessage: errorMap.sys.api.METHOD_NOT_ALLOWED,
      });
    }
  } catch (error) {
    treatErrors(error, "/api/webhook.clerk.ts");
  }
});

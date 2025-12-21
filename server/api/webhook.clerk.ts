import { WebhookClerkController } from "../../mvc/controllers/webhook.clerk";
import { treatErrors, treatResponses } from "../utils/responses";
import { errorMap } from "~~/shared/utils/errorMap";

export default defineEventHandler(async (event) => {
  try {
    if (event.method === "POST") {
      const response = await new WebhookClerkController(
        toWebRequest(event)
      ).handleEvent();

      return treatResponses(event, response);
    } else {
      throw createError({
        statusCode: 405,
        statusMessage: errorMap.sys.api.METHOD_NOT_ALLOWED,
      });
    }
  } catch (error) {
    treatErrors(error);
  }
});

import { UserController } from "../../../../mvc/controllers/user";
import { treatErrors, treatResponses } from "~~/server/utils/responses";
import { errorMap } from "~~/shared/utils/errorMap";

export default defineEventHandler(async (event) => {
  try {
    const userId = getRouterParam(event, "userId");

    if (!userId) {
      // TODO: Must implement pino for logging
      // INFO: This should be interna-purpose only
      console.error("[BAD REQUEST]: User ID is required");
      throw createError({
        statusCode: 400,
        statusMessage: errorMap.app.user.NOT_FOUND,
      });
    }

    const r = await new UserController(toWebRequest(event)).read({
      userId,
      intent: "GET_STATUS",
    });

    return treatResponses(event, r);
  } catch (error) {
    treatErrors(error);
  }
});

import { createRequestLogger } from "~~/server/utils/logger";
import { UserController } from "../../../../mvc/controllers/user";
import { treatErrors, treatResponses } from "~~/server/utils/responses";
import { errorMap } from "~~/shared/utils/errorMap";

const log = createRequestLogger("server.api.user.[userId].permissions.get.ts");

export default defineEventHandler(async (event) => {
  try {
    const userId = getRouterParam(event, "userId");

    if (!userId) {
      log.error(
        event.path,
        event.method,
        { params: { userId } },
        "[BAD REQUEST]: User ID is required",
      );
      throw createError({
        statusCode: 400,
        statusMessage: errorMap.app.user.NOT_FOUND,
      });
    }

    log.info(
      event.path,
      event.method,
      { params: { userId } },
      "[PERMISSIONS REQUEST]: Fetching user permissions",
    );

    const r = await new UserController(toWebRequest(event)).read({
      userId,
      intent: "GET_PERMISSIONS",
    });

    return treatResponses(event, r);
  } catch (error) {
    treatErrors(error);
  }
});

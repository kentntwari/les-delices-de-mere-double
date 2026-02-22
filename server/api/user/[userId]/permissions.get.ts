import { type H3Event } from "h3";

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
    return treatResponses(
      event,
      await cachedUserPermissionsResponse(event, userId),
    );
  } catch (error) {
    treatErrors(error);
  }
});

export const cachedUserPermissionsResponse = defineCachedFunction(
  async (event: H3Event, userId: string) => {
    return await new UserController(toWebRequest(event)).read({
      userId,
      intent: "GET_PERMISSIONS",
    });
  },
  {
    maxAge: 3600 * 24, // Cache for 24 hours
    name: "userPermissionsResponse",
    getKey: (event: H3Event, userId: string) => `user_permissions:${userId}`,
  },
);

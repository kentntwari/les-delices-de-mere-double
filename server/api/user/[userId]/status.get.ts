import { type H3Event } from "h3";

import { createRequestLogger } from "~~/server/utils/logger";
import { UserController } from "../../../../mvc/controllers/user";
import { treatErrors, treatResponses } from "~~/server/utils/responses";
import { errorMap } from "~~/shared/utils/errorMap";
import { JsonResponse } from "~~/mvc/controllers/base";

const logger = createRequestLogger("server.api.user.[userId].status.get.ts");

export default defineEventHandler(async (event) => {
  try {
    const userId = getRouterParam(event, "userId");

    if (!userId) {
      logger.error(
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

    logger.info(
      event.path,
      event.method,
      { params: { userId } },
      "[STATUS REQUEST]: Fetching user status",
    );

    return await cachedUserStatusResponse(event, userId).catch((e) => {
      logger.error(
        event.path,
        event.method,
        { params: { userId }, err: e },
        "[ERROR FETCHING USER STATUS]: Failed to fetch user status from cache",
      );
      throw e;
    });
  } catch (error) {
    treatErrors(error);
  }
});

export const cachedUserStatusResponse = defineCachedFunction(
  async (event: H3Event, userId: string) => {
    const r = await new UserController(toWebRequest(event)).read({
      userId,
      intent: "GET_STATUS",
    });

    if (r instanceof JsonResponse) return r.data;
    else
      throw createError({
        statusCode: r.status,
        statusMessage: r.message,
      });
  },
  {
    maxAge: 3600 * 24,
    swr: true, // Cache for 24 hours with stale-while-revalidate
    // Cache for 24 hours
    name: "user",
    getKey: (event: H3Event, userId: string) => `status_${userId}`,
  },
);

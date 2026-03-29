import { createRequestLogger } from "~~/server/utils/logger";
import { OrderController } from "../../../mvc/controllers/order";
import { CacheError, CacheUtil } from "~~/server/utils/cache";
import { SilentSuccessResponse } from "~~/mvc/controllers/base";

const log = createRequestLogger("server.api.orders.index.post.ts");

export default defineEventHandler(async (event) => {
  try {
    log.info(
      event.path,
      event.method,
      null,
      "POST REQUEST RECEIVED: Creating order",
    );

    const userId = event.context.auth.userId;

    if (!userId) {
      log.warn(
        event.path,
        event.method,
        { userId },
        "POST REQUEST Missing userId",
      );
      throw createError({
        statusCode: 401,
        message: "not authenticated",
      });
    }

    const r = await new OrderController(toWebRequest(event))
      .promoteUserId(userId)
      .create();

    if (r instanceof SilentSuccessResponse)
      await new CacheUtil(useStorage("cache"))
        .route("orders")
        .invalidate()
        .catch((error) => {
          log.warn(
            event.path,
            event.method,
            {
              error:
                error instanceof CacheError
                  ? error.message
                  : JSON.stringify(error),
            },
            "Failed to invalidate orders cache after order creation",
          );
        });

    return treatResponses(event, r);
  } catch (error) {
    return treatErrors(error);
  }
});

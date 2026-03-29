import { H3Event } from "h3";
import { createRequestLogger } from "~~/server/utils/logger";
import { OrderController } from "~~/mvc/controllers/order";
import { SilentSuccessResponse } from "~~/mvc/controllers/base";

const log = createRequestLogger("server.api.order.[orderId].index.delete.ts");

const defaultLogAfterCacheOp = (event: H3Event, error: unknown, msg: string) =>
  log.warn(
    event.path,
    event.method,
    {
      error:
        error instanceof CacheError ? error.message : JSON.stringify(error),
    },
    msg,
  );

const cache = new CacheUtil(useStorage("cache"));

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.auth.userId;

    if (!userId) {
      log.warn(
        event.path,
        event.method,
        { userId },
        "DELETE REQUEST Missing userId",
      );
      throw createError({
        statusCode: 401,
        message: "not authenticated",
      });
    }

    const orderId = getRouterParam(event, "orderId");

    log.info(
      event.path,
      event.method,
      { param: { orderId } },
      "DELETE REQUEST RECEIVED: Deleting order",
    );

    if (!orderId) {
      log.warn(
        event.path,
        event.method,
        { param: { orderId } },
        "DELETE REQUEST MISSING orderId in path parameters",
      );
      throw createError({
        statusCode: 400,
        message: "Missing orderId in path parameters",
      });
    }

    const r = await new OrderController(toWebRequest(event))
      .promoteUserId(userId)
      .delete(orderId);

    if (r instanceof SilentSuccessResponse)
      await Promise.all([
        cache
          .route("orders")
          .invalidate()
          .catch((error) =>
            defaultLogAfterCacheOp(
              event,
              error,
              "Failed to invalidate orders cache after order deletion",
            ),
          ),
        cache
          .handler("logs")
          .withKey(`orderId_${encodeURIComponent(orderId.toLowerCase())}`)
          .invalidate()
          .catch((error) =>
            defaultLogAfterCacheOp(
              event,
              error,
              `Failed to invalidate logs cache for order ${orderId} after deletion`,
            ),
          ),
      ]);

    return treatResponses(event, r);
  } catch (error) {
    return treatErrors(error);
  }
});

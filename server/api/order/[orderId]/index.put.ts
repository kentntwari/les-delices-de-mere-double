import { createRequestLogger } from "~~/server/utils/logger";
import { OrderController } from "~~/mvc/controllers/order";
import {
  handleOrderIntentsSchema,
  type THandleOrderIntentsSchema,
} from "~~/shared/utils/schemas.zod";
import { SilentSuccessResponse } from "~~/mvc/controllers/base";

const log = createRequestLogger("server.api.order.[orderId].index.put.ts");

const cache = new CacheUtil(useStorage("cache"));

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.auth.userId;

    if (!userId) {
      log.warn(
        event.path,
        event.method,
        { userId },
        "PUT REQUEST Missing userId",
      );
      throw createError({
        statusCode: 401,
        message: "not authenticated",
      });
    }

    const orderId = getRouterParam(event, "orderId");
    const query = getQuery(event);

    log.info(
      event.path,
      event.method,
      {
        param: { orderId },
        query,
      },
      "PUT REQUEST RECEIVED: Updating order",
    );

    if (!orderId) {
      log.warn(
        event.path,
        event.method,
        { param: { orderId }, query },
        "PUT REQUEST MISSING orderId in path parameters",
      );
      throw createError({
        statusCode: 400,
        message: "Missing orderId in path parameters",
      });
    }

    if (!("intent" in query) || typeof query.intent !== "string") {
      log.warn(
        event.path,
        event.method,
        { param: { orderId }, query },
        "PUT REQUEST MISSING intent in query parameters",
      );
      return;
    }

    const defaultLogAfterCacheOp = (error: unknown, msg: string) =>
      log.warn(
        event.path,
        event.method,
        {
          error:
            error instanceof CacheError ? error.message : JSON.stringify(error),
        },
        msg,
      );

    const validatedIntent = handleOrderIntentsSchema.safeParse(query.intent);

    if (!validatedIntent.success) {
      log.warn(
        event.path,
        event.method,
        { param: { orderId }, query, validationError: validatedIntent.error },
        "PUT REQUEST INVALID intent value in query parameters",
      );

      throw createError({
        statusCode: 400,
        message: "Invalid intent value in query parameters",
      });
    }

    const r = await new OrderController(toWebRequest(event))
      .promoteUserId(userId)
      .handleIntent(validatedIntent.data, orderId);

    if (r instanceof SilentSuccessResponse)
      await Promise.all([
        cache
          .route("orders")
          .invalidate()
          .catch((error) =>
            defaultLogAfterCacheOp(
              error,
              "Failed to invalidate orders cache after order update",
            ),
          ),
        cache
          .handler("logs")
          .withKey(`orderId_${encodeURIComponent(orderId.toLowerCase())}`)
          .invalidate()
          .catch((error) =>
            defaultLogAfterCacheOp(
              error,
              `Failed to invalidate logs cache for order ${orderId} after order update`,
            ),
          ),
      ]);

    return treatResponses(event, r);
  } catch (error) {
    return treatErrors(error);
  }
});

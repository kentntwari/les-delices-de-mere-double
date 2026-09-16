import { createRequestLogger } from "~~/server/utils/logger";
import { OrderCommentController } from "@repo/shared/mvc/controllers/comment";
import { SilentSuccessResponse } from "@repo/shared/mvc/controllers/base";
import { broadcastCommentDeleted } from "~~/server/utils/sseConnections";

const log = createRequestLogger(
  "server.api.order.[orderId].comments.[commentId].index.delete.ts",
);

const cache = new CacheUtil(useStorage("cache"));

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.auth().userId as string;
    const orderId = getRouterParam(event, "orderId");
    const commentId = getRouterParam(event, "commentId");

    if (!orderId || !commentId) {
      log.warn(
        event.path,
        event.method,
        { params: { orderId, commentId } },
        "DELETE REQUEST MISSING orderId or commentId in path parameters",
      );

      throw createError({
        statusCode: 400,
        statusMessage: "Missing orderId or commentId in path parameters",
      });
    }

    log.info(
      event.path,
      event.method,
      { params: { orderId, commentId }, userId },
      "DELETE REQUEST RECEIVED: Deleting order comment",
    );

    const r = await new OrderCommentController(toWebRequest(event))
      .promoteUserId(userId)
      .delete(orderId, commentId);

    if (r instanceof SilentSuccessResponse) {
      await Promise.all([
        cache
          .handler("comments")
          .withKey(`orderId_${encodeURIComponent(orderId.toLowerCase())}`)
          .invalidate(),
        cache
          .fn("order")
          .withKey(`order_preview_${encodeURIComponent(orderId.toLowerCase())}`)
          .invalidate(),
      ]).catch((error) => {
        log.warn(
          event.path,
          event.method,
          {
            error:
              error instanceof CacheError
                ? error.message
                : JSON.stringify(error),
          },
          "Failed to invalidate cache after deleting comment",
        );
      });

      broadcastCommentDeleted(orderId, { id: commentId });
    }

    return treatResponses(event, r);
  } catch (error) {
    return treatErrors(error);
  }
});

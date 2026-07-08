import { createRequestLogger } from "~~/server/utils/logger";
import { OrderController } from "~~/mvc/controllers/order";
import { broadcastComment } from "~~/server/utils/sseConnections";
import { JsonResponse } from "~~/mvc/controllers/base";

const log = createRequestLogger("server.api.order.[orderId].comments.post.ts");

export default defineEventHandler(async (event) => {
  try {
    const { orderId } = event.context.params as { orderId: string };
    const userId = event.context.auth().userId as string;

    log.info(
      event.path,
      event.method,
      { param: { orderId } },
      "POST REQUEST RECEIVED: Creating order comment",
    );

    const r = await new OrderController(toWebRequest(event))
      .promoteUserId(userId)
      .createComment(orderId);

    if (r instanceof JsonResponse) {
      log.info(
        event.path,
        event.method,
        { param: { orderId }, userId },
        "POST REQUEST Comment created successfully",
      );

      await Promise.all([
        new CacheUtil(useStorage("cache"))
          .handler("comments")
          .withKey(`orderId_${encodeURIComponent(orderId.toLowerCase())}`)
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
              "Failed to invalidate comments cache after comment creation",
            );
          }),
        new CacheUtil(useStorage("cache"))
          .fn("order")
          .withKey(`order_preview_${encodeURIComponent(orderId.toLowerCase())}`)
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
              "Failed to invalidate order cache after comment creation",
            );
          }),
      ]);

      const c = r.data.data;

      log.info(
        event.path,
        event.method,
        { param: { orderId }, commentId: c.id },
        "Broadcasting comment to SSE connections",
      );

      broadcastComment(orderId, {
        id: c.id,
        comment: c.comment,
        _meta: {
          mentionedUsers: [],
          createdAt: c.createdAt,
          createdBy: "You",
          likedCount: 0,
        },
      });
    }

    return sendNoContent(event);
  } catch (error) {
    treatErrors(error);
  }
});

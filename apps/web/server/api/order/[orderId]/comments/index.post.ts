import { createRequestLogger } from "~~/server/utils/logger";
import { OrderCommentController } from "@repo/shared/mvc/controllers/comment";
import { broadcastComment } from "~~/server/utils/sseConnections";
import { JsonResponse } from "@repo/shared/mvc/controllers/base";

const log = createRequestLogger("server.api.order.[orderId].comments.post.ts");

export default defineEventHandler(async (event) => {
  try {
    const { orderId } = event.context.params as { orderId: string };
    const { userId } = event.context.auth();

    log.info(
      event.path,
      event.method,
      { param: { orderId } },
      "POST REQUEST RECEIVED: Creating order comment",
    );

    const r = await new OrderCommentController(toWebRequest(event))
      .promoteUserId(userId!) //Because of previous middleware check
      .create(orderId);

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
          mentionedUsers: c.taggedUsers,
          source: c.source_comment,
          createdAt: c.createdAt,
          createdBy: c.user_name || "System User",
          likedCount: c.likedCount,
        },
      });

      return sendNoContent(event);
    }

    return treatResponses(event, r);
  } catch (error) {
    treatErrors(error);
  }
});

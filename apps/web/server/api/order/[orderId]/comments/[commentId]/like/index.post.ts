import { createRequestLogger } from "~~/server/utils/logger";
import { OrderCommentController } from "@repo/shared/mvc/controllers/comment";
import { JsonResponse } from "@repo/shared/mvc/controllers/base";
import { broadcastComment } from "~~/server/utils/sseConnections";
import type { IApiOrderCommentData } from "#shared/types";
import { DateUtils } from "@repo/shared/utils/date";

const log = createRequestLogger(
  "server.api.order.[orderId].comments.[commentId].like.index.post.ts",
);

function toApiComment(comment: {
  id: string;
  comment: string;
  source_comment: string | null;
  taggedUsers: string[];
  likedCount: number;
  user_name: string | undefined;
  createdAt: string;
}): IApiOrderCommentData {
  return {
    id: comment.id,
    comment: comment.comment,
    _meta: {
      source: comment.source_comment,
      mentionedUsers: comment.taggedUsers,
      likedCount: comment.likedCount,
      createdBy: comment.user_name || "UNKNOWN USER",
      createdAt: DateUtils.convertDate(new Date(comment.createdAt)),
    },
  };
}

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
        "POST REQUEST MISSING orderId or commentId in path parameters",
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
      "POST REQUEST RECEIVED: Liking order comment",
    );

    const r = await new OrderCommentController(toWebRequest(event))
      .promoteUserId(userId)
      .like(orderId, commentId);

    if (r instanceof JsonResponse) {
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
              "Failed to invalidate comments cache after liking comment",
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
              "Failed to invalidate order cache after liking comment",
            );
          }),
      ]);

      broadcastComment(orderId, toApiComment(r.data.data));
    }

    return treatResponses(event, r);
  } catch (error) {
    return treatErrors(error);
  }
});

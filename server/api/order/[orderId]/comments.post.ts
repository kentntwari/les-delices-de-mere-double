import { createRequestLogger } from "~~/server/utils/logger";
import { OrderController } from "~~/mvc/controllers/order";
import { broadcastComment } from "~~/server/utils/sseConnections";
import { JsonResponse } from "~~/mvc/controllers/base";

const log = createRequestLogger("server.api.order.[orderId].comments.post.ts");

export default defineEventHandler(async (event) => {
  try {
    const { orderId } = event.context.params as { orderId: string };
    const userId = event.context.auth().userId;

    if (!userId) {
      log.warn(
        event.path,
        event.method,
        { userId },
        "POST REQUEST Missing userId",
      );

      throw createError({
        statusCode: 401,
        statusMessage: "Not authenticated",
      });
    }

    log.info(
      event.path,
      event.method,
      { param: { orderId } },
      "POST REQUEST RECEIVED: Creating order comment",
    );

    // Check comment limit at the API layer
    const commentsResponse = await new OrderController(
      toWebRequest(event),
    ).handleIntent("get-comments", orderId);

    if (!(commentsResponse instanceof JsonResponse))
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to retrieve comments before posting new comment",
      });

    if (commentsResponse.data.data.length >= 10) {
      log.warn(
        event.path,
        event.method,
        { param: { orderId }, commentCount: commentsResponse.data.data.length },
        "POST REQUEST Comment limit reached for order",
      );
      throw createError({
        statusCode: 422,
        statusMessage: "Comment limit reached",
      });
    }

    const r = await new OrderController(toWebRequest(event))
      .promoteUserId(userId)
      .createComment(orderId);

    const result = treatResponses(event, r);

    if (r instanceof JsonResponse) {
      log.info(
        event.path,
        event.method,
        { param: { orderId }, userId },
        "POST REQUEST Comment created successfully, broadcasting to SSE clients",
      );

      broadcastComment(orderId, r.data.data);
    }

    return result;
  } catch (error) {
    treatErrors(error);
  }
});

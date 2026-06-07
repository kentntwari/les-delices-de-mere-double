import { createRequestLogger } from "~~/server/utils/logger";
import { OrderController } from "~~/mvc/controllers/order";
import { broadcastComment } from "~~/server/utils/sseConnections";
import type { TOrderCommentDTO } from "~~/mvc/mapper/order";
import { JsonResponse } from "~~/mvc/controllers/base";

const log = createRequestLogger(
  "server.api.order.[orderId].comments.post.ts",
);

export default defineEventHandler(async (event) => {
  try {
    const { orderId } = event.context.params as { orderId: string };
    const userId = event.context.auth?.userId;

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    log.info(
      event.path,
      event.method,
      { param: { orderId } },
      "POST REQUEST RECEIVED: Creating order comment",
    );

    const body = await readBody(event);

    const enrichedRequest = new Request(toWebRequest(event).url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, userId }),
    });

    const r = await new OrderController(enrichedRequest).handleIntent(
      "create-comment",
      orderId,
    );

    const result = treatResponses(event, r);

    if (r instanceof JsonResponse) {
      const comment = (r.data as { data: TOrderCommentDTO }).data;
      broadcastComment(orderId, comment);
    }

    return result;
  } catch (error) {
    treatErrors(error);
  }
});

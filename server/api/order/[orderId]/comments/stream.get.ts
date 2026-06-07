import { createEventStream } from "h3";
import { createRequestLogger } from "~~/server/utils/logger";
import { OrderController } from "~~/mvc/controllers/order";
import {
  addSSEConnection,
  removeSSEConnection,
} from "~~/server/utils/sseConnections";
import { JsonResponse } from "~~/mvc/controllers/base";
import type { TOrderCommentDTO } from "~~/mvc/mapper/order";

const log = createRequestLogger(
  "server.api.order.[orderId].comments.stream.get.ts",
);

export default defineEventHandler(async (event) => {
  const { orderId } = event.context.params as { orderId: string };

  log.info(
    event.path,
    event.method,
    { param: { orderId } },
    "SSE REQUEST RECEIVED: Opening comment stream",
  );

  // Check if order already has 10 comments
  const r = await new OrderController(toWebRequest(event)).handleIntent(
    "get-comments",
    orderId,
  );

  if (r instanceof JsonResponse) {
    const comments = (r.data as { data: TOrderCommentDTO[] }).data;
    if (comments.length >= 10) {
      setResponseStatus(event, 204);
      return null;
    }
  }

  const eventStream = createEventStream(event);

  addSSEConnection(orderId, eventStream);

  eventStream.onClosed(async () => {
    removeSSEConnection(orderId, eventStream);
    await eventStream.close();
  });

  return eventStream.send();
});

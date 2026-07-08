import { createEventStream } from "h3";
import { createRequestLogger } from "~~/server/utils/logger";
import { OrderController } from "~~/mvc/controllers/order";
import {
  addSSEConnection,
  removeSSEConnection,
} from "~~/server/utils/sseConnections";
import { JsonResponse } from "~~/mvc/controllers/base";

const log = createRequestLogger(
  "server.api.order.[orderId].comments.stream.get.ts",
);

export default defineEventHandler(async (event) => {
  const { orderId } = event.context.params as { orderId: string };
  const userId = event.context.auth().userId as string;

  log.info(
    event.path,
    event.method,
    { param: { orderId } },
    "SSE REQUEST RECEIVED: Opening comment stream",
  );

  // Check if order already has 10 comments
  const r = await new OrderController(toWebRequest(event))
    .promoteUserId(userId)
    .handleIntent("get-comments", orderId);

  if (r instanceof JsonResponse && r.data.data.length >= 10) {
    setResponseStatus(event, 204);
    return null;
  }

  const eventStream = createEventStream(event);

  addSSEConnection(orderId, eventStream);

  // Keep the SSE connection alive with a JSON payload the client serializer can ignore safely.
  const interval = setInterval(async () => {
    await eventStream.push({ event: "keepalive", data: "null" });
  }, 5000);

  eventStream.onClosed(async () => {
    clearInterval(interval);
    removeSSEConnection(orderId, eventStream);
    await eventStream.close();
  });

  return eventStream.send();
});

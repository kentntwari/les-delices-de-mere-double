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

  setResponseHeaders(event, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const writer = {
        write: (data: string) => {
          try {
            controller.enqueue(encoder.encode(data));
          } catch {
            // Stream may already be closed
          }
        },
        close: () => {
          try {
            controller.close();
          } catch {
            // Already closed
          }
        },
      };

      addSSEConnection(orderId, writer);

      // Send initial keepalive
      writer.write(": keepalive\n\n");

      // Handle client disconnect
      event.node.req.on("close", () => {
        removeSSEConnection(orderId, writer);
        writer.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

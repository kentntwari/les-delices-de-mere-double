import { createRequestLogger } from "~~/server/utils/logger";
import { OrderController } from "~~/mvc/controllers/order";

const log = createRequestLogger(
  "server.api.order.[orderId].metadata.count.get.ts",
);

export default defineEventHandler(async (event) => {
  try {
    const { orderId } = event.context.params as { orderId: string };

    log.info(
      event.path,
      event.method,
      {
        param: { orderId },
      },
      "GET REQUEST RECEIVED: Getting order count metadata",
    );

    const r = await new OrderController(toWebRequest(event)).handleIntent(
      "get-order-count-metadata",
      orderId,
    );
    return treatResponses(event, r);
  } catch (error) {
    treatErrors(error);
  }
});

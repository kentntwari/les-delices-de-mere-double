import { createRequestLogger } from "~~/server/utils/logger";
import { OrderController } from "~~/mvc/controllers/order";

const log = createRequestLogger("server.api.order.[orderId].logs.get.ts");

export default defineCachedEventHandler(
  async (event) => {
    let id: string = "UNKNOWN_ORDER_ID";

    try {
      const { orderId } = event.context.params as { orderId: string };

      id = orderId;

      log.info(
        event.path,
        event.method,
        {
          param: { orderId },
        },
        "GET REQUEST RECEIVED: Getting order logs",
      );

      const r = await new OrderController(toWebRequest(event)).handleIntent(
        "get-logs",
        orderId,
      );
      return treatResponses(event, r);
    } catch (error) {
      treatErrors(error);
    }
  },
  {
    name: "logs",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    swr: false,
    getKey: (event) => {
      const { orderId } = event.context.params as { orderId: string };
      if (!orderId) return "orderId_missing";
      return `orderId_${encodeURIComponent(orderId.toLowerCase())}`;
    },
  },
);

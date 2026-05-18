import { OrderController } from "~~/mvc/controllers/order";

const log = createRequestLogger(
  "server.api.order.[orderId].metadata.delivery.get.ts",
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
      "GET REQUEST RECEIVED: Getting order delivery details",
    );

    const r = await new OrderController(toWebRequest(event)).handleIntent(
      "get-order-delivery-details",
      orderId,
    );
    return treatResponses(event, r);
  } catch (error) {
    treatErrors(error);
  }
});

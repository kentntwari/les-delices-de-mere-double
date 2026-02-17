import { createRequestLogger } from "~~/server/utils/logger";
import { OrderController } from "../../../mvc/controllers/order";

const log = createRequestLogger("server.api.orders.index.get.ts");

export default defineEventHandler(async (event) => {
  try {
    log.info(
      event.path,
      event.method,
      null,
      "GET REQUEST RECEIVED: Listing orders",
    );
    const r = await new OrderController(toWebRequest(event)).list();
    return treatResponses(event, r);
  } catch (error) {
    treatErrors(error);
  }
});

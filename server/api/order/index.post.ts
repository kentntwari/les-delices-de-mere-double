import { createRequestLogger } from "~~/server/utils/logger";
import { OrderController } from "../../../mvc/controllers/order";

const log = createRequestLogger("server.api.orders.index.post.ts");

export default defineEventHandler(async (event) => {
  try {
    log.info(
      event.path,
      event.method,
      null,
      "POST REQUEST RECEIVED: Creating order",
    );
    const r = await new OrderController(toWebRequest(event)).create();
    return treatResponses(event, r);
  } catch (error) {
    treatErrors(error);
  }
});

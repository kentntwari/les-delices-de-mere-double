import { createRequestLogger } from "~~/server/utils/logger";
import { OrderController } from "../../../mvc/controllers/order";
import { CacheUtil } from "~~/server/utils/cache";
import { SilentSuccessResponse } from "~~/mvc/controllers/base";

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

    if (r instanceof SilentSuccessResponse)
      await new CacheUtil(useStorage("cache")).invalidateRouteCache("orders");

    return treatResponses(event, r);
  } catch (error) {
    treatErrors(error);
  }
});

import { createRequestLogger } from "~~/server/utils/logger";
import { MenuController } from "../../../mvc/controllers/menu";
import { SilentSuccessResponse } from "~~/mvc/controllers/base";

const log = createRequestLogger("server.api.item.index.post.ts");

export default defineEventHandler(async (event) => {
  try {
    log.info(
      event.path,
      event.method,
      await readBody(event),
      "POST REQUEST RECEIVED: Creating new menu item",
    );
    const r = await new MenuController(toWebRequest(event)).create();

    if (r instanceof SilentSuccessResponse)
      await new CacheUtil(useStorage("cache")).invalidateRouteCache(
        "menu",
        "apiitemsmenu",
      );
      
    return treatResponses(event, r);
  } catch (error) {
    treatErrors(error);
  }
});

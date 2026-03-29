import { createRequestLogger } from "~~/server/utils/logger";
import { MenuController } from "../../../mvc/controllers/menu";
import { SilentSuccessResponse } from "~~/mvc/controllers/base";
import { CacheError } from "~~/server/utils/cache";

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
      await new CacheUtil(useStorage("cache"))
        .route("items")
        .invalidate()
        .catch((error) => {
          log.warn(
            event.path,
            event.method,
            {
              error:
                error instanceof CacheError
                  ? error.message
                  : JSON.stringify(error),
            },
            "Failed to invalidate menu cache after creating new menu item",
          );
        });

    return treatResponses(event, r);
  } catch (error) {
    return treatErrors(error);
  }
});

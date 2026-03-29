import { createRequestLogger } from "~~/server/utils/logger";
import { MenuController } from "~~/mvc/controllers/menu";
import { SilentSuccessResponse } from "~~/mvc/controllers/base";
import { CacheError } from "~~/server/utils/cache";

const log = createRequestLogger("server.api.item.index.put.ts");

/* FIX: This endpoint should move to /item/[itemId].put.ts */
/* FIX: id of the item should be extracted from the URL parameter */
export default defineEventHandler(async (event) => {
  try {
    log.info(
      event.path,
      event.method,
      await readBody(event),
      "PUT REQUEST RECEIVED: Updating menu item",
    );

    const headers = getRequestHeaders(event);

    // Header keys from the runtime are usually lower-cased; accept either form.
    const customTitleHeader = "X-Update-Title";
    const customPricingHeader = "X-Update-Pricing";

    const HasUpdateTitleHeader =
      (headers[customTitleHeader] === "true" ||
        headers[customTitleHeader.toLowerCase()] === "true") === true;

    const HasUpdatePricingHeader =
      (headers[customPricingHeader] === "true" ||
        headers[customPricingHeader.toLowerCase()] === "true") === true;

    const cacheUtil = new CacheUtil(useStorage("cache"));

    const invalidateMenuCache = async () => {
      await cacheUtil
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
            "Failed to invalidate menu cache after updating menu item",
          );
        });
    };

    if (HasUpdateTitleHeader) {
      const r = await new MenuController(toWebRequest(event)).update("title");
      if (r instanceof SilentSuccessResponse) await invalidateMenuCache();
      return treatResponses(event, r);
    }

    if (HasUpdatePricingHeader) {
      const r = await new MenuController(toWebRequest(event)).update("price");
      if (r instanceof SilentSuccessResponse) await invalidateMenuCache();
      return treatResponses(event, r);
    }

    throw createError({
      statusCode: 400,
      statusMessage: "No valid update headers provided",
    });
  } catch (error) {
    return treatErrors(error);
  }
});

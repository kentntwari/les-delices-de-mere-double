import { SilentSuccessResponse } from "~~/mvc/controllers/base";
import { MenuController } from "~~/mvc/controllers/menu";

const log = createRequestLogger("server.api.item.[itemId].index.delete.ts");

export default defineEventHandler(async (event) => {
  try {
    const itemId = getRouterParam(event, "itemId");

    if (!itemId) {
      log.warn(
        event.path,
        event.method,
        { params: { itemId } },
        "[BAD REQUEST]: Item ID is required",
      );

      throw createError({
        statusCode: 400,
        statusMessage: "Item ID is required",
      });
    }

    log.info(
      event.path,
      event.method,
      { params: { itemId } },
      "DELETE REQUEST RECEIVED: Deleting menu item",
    );

    const r = await new MenuController(toWebRequest(event)).delete(itemId);

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
            "Failed to invalidate menu cache after deleting menu item",
          );
        });

    return treatResponses(event, r);
  } catch (error) {
    return treatErrors(error);
  }
});

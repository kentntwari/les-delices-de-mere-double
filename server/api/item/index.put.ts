import { createRequestLogger } from "~~/server/utils/logger";
import { MenuController } from "../../../mvc/controllers/menu";
import { IMenuItemsCustomRequestHeaders } from "~~/shared/types";

const log = createRequestLogger("/api/item/index.put.ts");

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

    if (HasUpdateTitleHeader) {
      const r = await new MenuController(toWebRequest(event)).update("title");
      return treatResponses(event, r, "/api/item/index.put.ts");
    }

    if (HasUpdatePricingHeader) {
      const r = await new MenuController(toWebRequest(event)).update("price");
      return treatResponses(event, r, "/api/item/index.put.ts");
    }

    throw createError({
      statusCode: 400,
      statusMessage: "No valid update headers provided",
    });
  } catch (error) {
    treatErrors(error, "/api/item/index.put.ts");
  }
});

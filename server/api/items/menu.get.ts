import { createRequestLogger } from "~~/server/utils/logger";
import { MenuController } from "../../../mvc/controllers/menu";

const log = createRequestLogger("/api/items/menu.get.ts");

export default defineEventHandler(async (event) => {
  try {
    log.info(
      event.path,
      event.method,
      null,
      "GET REQUEST RECEIVED: Fetching menu items"
    );
    const r = await new MenuController(toWebRequest(event)).read();
    return treatResponses(event, r, "/api/items/menu.get.ts");
  } catch (error) {
    treatErrors(error, "/api/items/menu.get.ts");
  }
});

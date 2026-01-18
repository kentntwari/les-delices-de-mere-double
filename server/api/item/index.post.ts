import { createRequestLogger } from "~~/server/utils/logger";
import { MenuController } from "../../../mvc/controllers/menu";

const log = createRequestLogger("/api/item/index.post.ts");

export default defineEventHandler(async (event) => {
  try {
    log.info(
      event.path,
      event.method,
      await readBody(event),
      "POST REQUEST RECEIVED: Creating new menu item"
    );
    const r = await new MenuController(toWebRequest(event)).create();
    return treatResponses(event, r, "/api/item/index.post.ts");
  } catch (error) {
    treatErrors(error, "/api/item/index.post.ts");
  }
});

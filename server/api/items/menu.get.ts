import { createRequestLogger } from "~~/server/utils/logger";
import { MenuController } from "../../../mvc/controllers/menu";

const log = createRequestLogger("server.api.items.menu.get.ts");

export default defineCachedEventHandler(
  async (event) => {
    try {
      log.info(
        event.path,
        event.method,
        null,
        "GET REQUEST RECEIVED: Fetching menu items",
      );

      const r = await new MenuController(toWebRequest(event)).read();
      return treatResponses(event, r);
    } catch (error) {
      treatErrors(error);
    }
  },
  {
    name: "menu",
  },
);

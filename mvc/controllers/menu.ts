import {
  BaseController,
  BadRequestResponse,
  JsonResponse,
  SilentSuccessResponse,
} from "./base";
import { MenuService } from "../service/menu";
import { MenuItemMapper } from "../mapper/item";

export class MenuController extends BaseController {
  constructor(
    req: Request,
    private service: MenuService = new MenuService(),
    private mapper: MenuItemMapper = new MenuItemMapper(),
  ) {
    super(req);
  }

  async read() {
    try {
      logger.info({ source: "controllers.menu.read" }, "Fetching menu items");
      const items = await this.service.listItems();
      return new JsonResponse({
        data: this.mapper.toDtoList(items),
      });
    } catch (error) {
      this.logError(error, {
        origin: "controllers.menu.read",
      });
      return this.mapErrorResponse(error, {
        origin: "controllers.menu.read",
      });
    }
  }

  async create() {
    try {
      logger.info({ source: "controllers.menu.create" }, "Creating menu item");
      await this.service.addNewItem(await this.getBody());
      return new SilentSuccessResponse();
    } catch (error) {
      this.logError(error, {
        origin: "controllers.menu.create",
      });
      return this.mapErrorResponse(error, {
        origin: "controllers.menu.create",
      });
    }
  }

  async update(target: "title" | "price") {
    try {
      logger.info(
        { source: "controllers.menu.update" },
        `Updating menu item ${target}`,
      );

      const body = await this.getBody();
      
      if (target === "title")
        await this.service.updateItem("UPDATE_TITLE", body);
      else if (target === "price")
        await this.service.updateItem("UPDATE_PRICING", body);
      else throw new BadRequestResponse("Invalid update target");

      return new SilentSuccessResponse();
    } catch (error) {
      this.logError(error, {
        origin: "controllers.menu.update",
      });
      return this.mapErrorResponse(error, {
        origin: "controllers.menu.update",
      });
    }
  }

  async delete(args: any) {
    return new BadRequestResponse("Not implemented yet");
  }
}

import type {
  TUpdateItemSchema,
  TUpdateItemIntents,
} from "../../shared/utils/schemas.zod";
import { MenuItemEntity } from "../entities/item";
import { ApplicationError } from "../errors.appwide";
import { ItemFactory } from "../factories/item";
import { MenuItemMapper } from "../mapper/item";
import { ItemRepository } from "../repository/item";
import { BaseService } from "./base";

type TUpdateItemData = Partial<TUpdateItemSchema> & {
  intents: TUpdateItemIntents;
};

export const MenuServiceFailuresMessages = {
  list: "Failed to list menu items",
  create: "Failed to create menu item",
  update: "Failed to update menu item",
  delete: "Failed to delete menu item",
} as const;

export class MenuService extends BaseService {
  constructor(
    private repository: ItemRepository = new ItemRepository(),
    private factory: ItemFactory = new ItemFactory(),
    private mapper: MenuItemMapper = new MenuItemMapper(),
  ) {
    super();
  }

  async list() {
    try {
      const items = await this.repository.getMenuItems();
      return this.mapper.toEntityList(items);
    } catch (error) {
      this.defaultMapError(error, "service.menu.list");
      throw error;
    }
  }

  async create(item: unknown): Promise<MenuItemEntity> {
    try {
      const t = ItemFactory.validateCreateItem(item);
      const b = this.factory.safeBuild(t);
      const newItem = await this.repository.createMenuItem(
        this.mapper.toSafeModel(this.factory.create(this.mapper.toDto(b))),
      );

      return this.mapper.toEntity(newItem);
    } catch (error) {
      this.defaultMapError(error, "service.menu.create");
      throw error;
    }
  }

  async update(intent: TUpdateItemIntents, data: unknown): Promise<void> {
    try {
      const validated = ItemFactory.validateUpdateItem(data);

      if (intent === "UPDATE_TITLE" && !validated.title)
        throw new ApplicationError(
          MenuServiceFailuresMessages.update + ": Title is required for title update",
          {
            source: "service.menu.update",
          },
        );
      else if (intent === "UPDATE_PRICING" && !validated.unitPrice)
        throw new ApplicationError(
          MenuServiceFailuresMessages.update + ": Unit price is required for price update",
          {
            source: "service.menu.update",
          },
        );

      await this.repository.updateMenuItem(validated);
    } catch (error) {
      this.defaultMapError(error, "service.menu.update");
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.repository.deleteMenuItem(id);
    } catch (error) {
      this.defaultMapError(error, "service.menu.delete");
      throw error;
    }
  }
}

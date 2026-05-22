import {
  type TMenuSchema,
  type TCreateItemSchema,
  type TUpdateItemSchema,
  menuSchema,
  createItemSchema,
  updateItemSchema,
} from "../../shared/utils/schemas.zod";
import { BaseFactory } from "./base";
import { MenuItemEntity } from "../entities/item";
import { ApplicationError } from "../errors.appwide";

type TMenuItemDTO = TMenuSchema["items"][number];
type TCreatedItemDTO = TCreateItemSchema;
type TUpdateItemDTO = Partial<Omit<TUpdateItemSchema, "id">> & { id: string };
export class ItemFactory extends BaseFactory<TMenuItemDTO, MenuItemEntity> {
  public build(data: TMenuItemDTO): MenuItemEntity {
    return new MenuItemEntity(data.id, data.title, data.slug, data.unitPrice);
  }

  public safeBuild(data: Partial<TMenuItemDTO>): MenuItemEntity {
    const id =
      typeof data.id === "string" && data.id.trim()
        ? data.id
        : MenuItemEntity.generateID();

    const title = typeof data.title === "string" ? data.title.trim() : "";

    const slug = typeof data.slug === "string" ? data.slug.trim() : "";

    const rawPrice = Number(data.unitPrice);
    const unitPrice = Number.isFinite(rawPrice) && rawPrice >= 0 ? rawPrice : 0;

    return new MenuItemEntity(id, title, slug, unitPrice);
  }

  public validate(data: unknown): TMenuItemDTO {
    try {
      const parsedData = menuSchema.shape.items.element.safeParse(data);
      if (parsedData.success) return parsedData.data;
      throw new ApplicationError("Validation failed", {
        issues: JSON.stringify(parsedData.error.issues),
        input: JSON.stringify(data),
        source: "mvc.factories.item.ItemFactory.validate",
      });
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      else
        throw new ApplicationError(
          "Unknown error occured during validation of menu item",
          {
            originalError: JSON.stringify(error),
            input: JSON.stringify(data),
            source: "mvc.factories.item.ItemFactory.validate",
          },
        );
    }
  }

  static validateCreateItem(data: unknown): TCreatedItemDTO {
    const parsedData = createItemSchema.safeParse(data);
    if (parsedData.success) return parsedData.data;
    throw new ApplicationError("Validation failed", {
      issues: JSON.stringify(parsedData.error.issues),
      input: JSON.stringify(data),
      source: "mvc.factories.item.ItemFactory.validateCreateItem",
    });
  }

  static validateUpdateItem(data: unknown): TUpdateItemDTO {
    const parsed = updateItemSchema.safeParse(data);
    if (parsed.success && !parsed.data.title && !parsed.data.unitPrice)
      throw new ApplicationError(
        "At least one field to update must be provided",
        {
          input: JSON.stringify(data),
          source: "mvc.factories.item.ItemFactory.validateUpdateItem",
        },
      );
    else if (parsed.success) return parsed.data;
    else
      throw new ApplicationError("Validation failed", {
        issues: JSON.stringify(parsed.error.issues),
        input: JSON.stringify(data),
        source: "mvc.factories.item.ItemFactory.validateUpdateItem",
      });
  }
}

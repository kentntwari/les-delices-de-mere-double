import type { MenuItemModel } from "../repository/item";
import type { TMenuSchema as TMenuDTO } from "../../shared/utils/schemas.zod";

import { BaseMapper } from "./base";

import { MenuItemEntity } from "../entities/item";

export class MenuItemMapper extends BaseMapper<
  MenuItemEntity,
  TMenuDTO["items"][number],
  MenuItemModel
> {
  toEntity(data: MenuItemModel): MenuItemEntity {
    return new MenuItemEntity(data.id, data.title, data.slug, data.unitPrice);
  }

  toEntityList(data: MenuItemModel[]): MenuItemEntity[] {
    return data.map((item) => this.toEntity(item));
  }

  toSafeModel(entity: MenuItemEntity): MenuItemModel {
    return {
      id: entity.id,
      title: entity.title,
      slug: entity.slug ?? "",
      unitPrice: entity.unitPrice,
      description: null,
    };
  }

  toDto(entity: MenuItemEntity): TMenuDTO["items"][number] {
    return {
      id: entity.id,
      slug: entity.slug || "",
      title: entity.title,
      unitPrice: entity.unitPrice,
    };
  }

  toDtoList(entities: MenuItemEntity[]): TMenuDTO {
    return { items: entities.map((entity) => this.toDto(entity)) };
  }
}

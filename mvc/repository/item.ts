import { Prisma } from "@prisma/client";

import { db as dbClient } from "../../server/utils/db";
import { DatabaseError } from "../errors.db";

export type MenuItemModel = Prisma.MenuItemGetPayload<{
  omit: { createdAt: true; updatedAt: true };
}>;

export const RepositoryFailuresMessages = {
  getMenuItems: "Failed to get menu items from database",
  getMenuItem: "Failed to get menu item from database",
  createMenuItem: "Failed to create menu item in database",
  updateMenuItem: "Failed to update menu item in database",
  deleteMenuItem: "Failed to delete menu item from database",
} as const;

export interface IItemRepository {
  getMenuItems(): Promise<MenuItemModel[]>;
  getMenuItem(id: string): Promise<MenuItemModel | null>;
  createMenuItem(data: MenuItemModel): Promise<MenuItemModel>;
  updateMenuItem(
    data: Partial<Omit<MenuItemModel, "slug">>,
  ): Promise<MenuItemModel>;
  deleteMenuItem(id: string): Promise<void>;
}

export class ItemRepository implements IItemRepository {
  constructor(private db = dbClient) {}

  async getMenuItems() {
    try {
      return await this.db.menuItem.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          slug: true,
          unitPrice: true,
        },
      });
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.getMenuItems, {
        operation: "getMenuItems",
        error,
      });
    }
  }

  async getMenuItem(id: string) {
    try {
      return await this.db.menuItem.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          slug: true,
          unitPrice: true,
        },
      });
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.getMenuItem, {
        operation: "getMenuItem",
        itemId: id,
        error,
      });
    }
  }

  async createMenuItem(data: MenuItemModel) {
    try {
      return await this.db.menuItem.create({
        data: {
          id: data.id,
          title: data.title.toLowerCase(),
          description: data.description?.toLowerCase(),
          slug: data.slug,
          unitPrice: data.unitPrice,
        },
      });
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.createMenuItem, {
        operation: "createMenuItem",
        error,
      });
    }
  }

  async updateMenuItem(data: Parameters<IItemRepository["updateMenuItem"]>[0]) {
    try {
      if (!data.id)
        throw new DatabaseError(RepositoryFailuresMessages.updateMenuItem, {
          operation: "updateMenuItem",
        });

      const currentItem = await this.getMenuItem(data.id);
      if (!currentItem)
        throw new DatabaseError(RepositoryFailuresMessages.updateMenuItem, {
          operation: "updateMenuItem",
          itemId: data.id,
        });

      return await this.db.menuItem.update({
        where: { id: data.id },
        data: {
          title: data.title?.toLowerCase() ?? currentItem.title,
          description:
            data.description?.toLowerCase() ?? currentItem.description,
          unitPrice: data.unitPrice ?? currentItem.unitPrice,
        },
      });
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(RepositoryFailuresMessages.updateMenuItem, {
        operation: "updateMenuItem",
        data,
        error,
      });
    }
  }

  async deleteMenuItem(id: string) {
    try {
      await this.db.menuItem.delete({
        where: { id },
      });
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.deleteMenuItem, {
        operation: "deleteMenuItem",
        itemId: id,
        error,
      });
    }
  }
}

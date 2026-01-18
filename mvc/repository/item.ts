import { Prisma } from "@prisma/client";

import { db as dbClient } from "../../server/utils/db";
import { DatabaseError } from "../errors.db";

export type MenuItemModel = Prisma.MenuItemGetPayload<{
  omit: { createdAt: true; updatedAt: true };
}>;

export type OrderedItemModel = Prisma.OrderedItemGetPayload<{
  omit: { itemId: true; createdAt: true; updatedAt: true };
}> &
  Prisma.MenuItemGetPayload<{
    select: {
      title: true;
      slug: true;
      unitPrice: true;
    };
  }>;

interface IItemRepository {
  getMenuItems(): Promise<MenuItemModel[]>;
  getMenuItem(id: string): Promise<MenuItemModel | null>;
  createMenuItem(data: MenuItemModel): Promise<MenuItemModel>;
  updateMenuItem(
    data: Partial<Omit<MenuItemModel, "slug">>,
  ): Promise<MenuItemModel>;
  getOrderItems(): Promise<OrderedItemModel[]>;
  getOrderItem(id: string): Promise<OrderedItemModel | null>;
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
      throw new DatabaseError("Failed to get menu items from database", {
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
      throw new DatabaseError("Failed to get menu item from database", {
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
          title: data.title,
          description: data.description,
          slug: data.slug,
          unitPrice: data.unitPrice,
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to create menu item in database", {
        operation: "createMenuItem",
        error,
      });
    }
  }

  async updateMenuItem(data: Parameters<IItemRepository["updateMenuItem"]>[0]) {
    try {
      if (!data.id)
        throw new DatabaseError("Item ID is required for update", {
          operation: "updateMenuItem",
        });

      const currentItem = await this.getMenuItem(data.id);
      if (!currentItem)
        throw new DatabaseError("Menu item not found for update", {
          operation: "updateMenuItem",
          itemId: data.id,
        });

      return await this.db.menuItem.update({
        where: { id: data.id },
        data: {
          title: data.title ?? currentItem.title,
          description: data.description ?? currentItem.description,
          unitPrice: data.unitPrice ?? currentItem.unitPrice,
        },
      });
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError("Failed to update menu item in database", {
        operation: "updateMenuItem",
        data,
        error,
      });
    }
  }

  async getOrderItems() {
    try {
      const b = await this.db.orderedItem.findMany({
        omit: { itemId: true, createdAt: true, updatedAt: true },
        include: {
          item: {
            select: {
              title: true,
              slug: true,
              unitPrice: true,
            },
          },
        },
      });
      return b.map(
        (orderedItem) =>
          ({
            ...orderedItem,
            title: orderedItem.item.title,
            slug: orderedItem.item.slug,
            unitPrice: orderedItem.item.unitPrice,
          }) satisfies OrderedItemModel,
      );
    } catch (error) {
      throw new DatabaseError("Failed to get ordered items from database", {
        operation: "getOrderedItems",
        error,
      });
    }
  }

  async getOrderItem(id: string) {
    try {
      const orderedItem = await this.db.orderedItem.findUnique({
        where: { id },
        omit: { itemId: true, createdAt: true, updatedAt: true },
        include: {
          item: {
            select: {
              title: true,
              slug: true,
              unitPrice: true,
            },
          },
        },
      });
      if (!orderedItem) return null;
      return {
        ...orderedItem,
        title: orderedItem.item.title,
        slug: orderedItem.item.slug,
        unitPrice: orderedItem.item.unitPrice,
      } as OrderedItemModel;
    } catch (error) {
      throw new DatabaseError("Failed to get ordered item from database", {
        operation: "getOrderedItem",
        itemId: id,
        error,
      });
    }
  }
}

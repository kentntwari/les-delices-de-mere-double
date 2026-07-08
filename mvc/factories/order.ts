import type { TOrderPreviewRepositoryModel } from "~~/shared/types";
import {
  type TOrderSchema,
  type TCreateOrderFormSchema,
  type TUpdateOrderFormSchema,
  type TCreateOrderCommentSchema,
  orderSchema,
  createOrderFormSchema,
  updateOrderFormSchema,
  createOrderCommentSchema,
} from "../../shared/utils/schemas.zod";

import { BaseFactory } from "./base";
import { OrderEntity } from "../entities/order";
import { MenuItemEntity, OrderedItemEntity } from "../entities/item";
import { ApplicationError } from "../errors.appwide";
import type {
  OrderCommentModel,
  OrderLogModel,
  OrderModel,
} from "../repository/order";

type TOrderDTO = Omit<TOrderSchema, "total"> & { customerId: string };
type TCreateOrderDTO = TCreateOrderFormSchema;
type TUpdateOrderDTO = TUpdateOrderFormSchema;
type TCreateOrderCommentDTO = TCreateOrderCommentSchema;

export class OrderFactory extends BaseFactory<TOrderDTO, OrderEntity> {
  static hasRequestedDelivery(fee: number | string | null | undefined) {
    if (fee === null || fee === undefined) return false;

    const normalizedFee =
      typeof fee === "number" ? fee : Number.parseFloat(fee);

    return Number.isFinite(normalizedFee) && normalizedFee > 0;
  }

  public build(data: TOrderDTO): OrderEntity {
    return new OrderEntity(
      data.id,
      data.customerId,
      data.items.map((item) => {
        return new OrderedItemEntity(
          item.id,
          data.id,
          item.title,
          MenuItemEntity.createSlug(item.title),
          item.unitPrice,
          item.quantity,
        );
      }),
    );
  }

  public validate(data: unknown): TOrderDTO {
    try {
      const customerId =
        typeof data === "object" && data !== null && "customerId" in data
          ? (data as { customerId: unknown }).customerId
          : undefined;

      if (typeof customerId !== "string" || customerId.trim() === "") {
        throw new ApplicationError(
          "Validation failed: customerId is required",
          {
            input: data,
            source: "mvc.factories.order.OrderFactory.validate",
          },
        );
      }

      const parsedData = orderSchema.safeParse(data);
      if (parsedData.success) return { ...parsedData.data, customerId };
      throw new ApplicationError("Validation failed", {
        issues: parsedData.error.issues,
        input: JSON.stringify(data),
        source: "mvc.factories.order.OrderFactory.validate",
      });
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      else
        throw new ApplicationError(
          "Unknown error occurred during validation of order",
          {
            originalError: error,
            input: data,
            source: "mvc.factories.order.OrderFactory.validate",
          },
        );
    }
  }

  public validateCreateOrder(data: unknown): TCreateOrderDTO {
    try {
      const parsedData = createOrderFormSchema.safeParse(data);
      if (parsedData.success) return parsedData.data;
      throw new ApplicationError("Validation failed", {
        issues: parsedData.error.issues,
        input: JSON.stringify(data),
        source: "mvc.factories.order.OrderFactory.validateCreateOrder",
      });
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      else
        throw new ApplicationError(
          "Unknown error occurred during validation of create order form",
          {
            originalError: error,
            input: data,
            source: "mvc.factories.order.OrderFactory.validateCreateOrder",
          },
        );
    }
  }

  public validateUpdateOrder(data: unknown): TUpdateOrderDTO {
    try {
      const parsedData = updateOrderFormSchema.safeParse(data);
      if (parsedData.success) return parsedData.data;
      throw new ApplicationError("Validation failed", {
        issues: parsedData.error.issues,
        input: JSON.stringify(data),
        source: "mvc.factories.order.OrderFactory.validateUpdateOrder",
      });
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      else
        throw new ApplicationError(
          "Unknown error occurred during validation of update order form",
          {
            originalError: error,
            input: data,
            source: "mvc.factories.order.OrderFactory.validateUpdateOrder",
          },
        );
    }
  }

  public validateCreateComment(data: unknown): TCreateOrderCommentDTO {
    try {
      const parsedData = createOrderCommentSchema.safeParse(data);
      if (parsedData.success) return parsedData.data;
      throw new ApplicationError("Validation failed", {
        issues: parsedData.error.issues,
        input: JSON.stringify(data),
        source: "mvc.factories.order.OrderFactory.validateCreateComment",
      });
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      else
        throw new ApplicationError(
          "Unknown error occurred during validation of create order comment",
          {
            originalError: error,
            input: data,
            source: "mvc.factories.order.OrderFactory.validateCreateComment",
          },
        );
    }
  }

  static fromModel(model: OrderModel): OrderEntity {
    return new OrderEntity(
      model.id,
      model.customerId || "UNKNOWN_CUSTOMER_ID",
      // FIX: This should come from a ItemMapper or similar
      model.items.map(
        ({ orderId, item, quantity, itemId }) =>
          new OrderedItemEntity(
            // INFO: Instead of using the assigned id best to use the parent menu item id to avoid mismatches with menu items
            itemId || item?.id || "UNKNOWN_ITEM_ID",
            orderId ?? "",
            item?.title ?? "UNKNOWN_ITEM_TITLE",
            "",
            item?.unitPrice ?? 0,
            quantity,
          ),
      ),
      model.status,
      model.paymentStatus,
      this.hasRequestedDelivery(model.deliveryFee)
        ? "requested"
        : "not-requested",
    );
  }

  static fromPreview(model: TOrderPreviewRepositoryModel): OrderModel {
    return {
      id: model.id,
      status: model.status,
      paymentStatus: model.paymentStatus,
      items: model.items.map((i) => ({
        id: i.item?.id || "UNKNOWN_ITEM_ID",
        item: {
          ...i.item,
          id: i.item?.id || "UNKNOWN_ITEM_ID",
          title: i.item?.title || "UNKNOWN_ITEM_TITLE",
          unitPrice: i.item?.unitPrice || 0,
          slug: i.item?.slug || "UNKNOWN_ITEM_SLUG",
        },
        quantity: i.quantity,
        orderId: model.id,
        itemId: i.item?.id || "UNKNOWN_ITEM_ID",
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      customerId: model.customer?.id || "UNKNOWN_CUSTOMER_ID",
      deliveryAddressId: null,
      deliveryFee: model.deliveryFee,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}

export class OrderLogFactory extends OrderFactory {
  static fromOrderPreview(
    model: TOrderPreviewRepositoryModel,
  ): OrderLogModel[] {
    return model.logs.map((log) => ({
      id: log.id,
      orderId: model.id,
      message: log.message,
      createdAt: log.createdAt,
    }));
  }
}

export class OrderCommentFactory extends OrderFactory {
  static fromOrderPreview(
    model: TOrderPreviewRepositoryModel,
  ): OrderCommentModel[] {
    return model.orderComments.map((comment) => ({
      id: comment.id,
      orderId: model.id,
      userId: comment.user?.id || "UNKNOWN_USER_ID",
      comment: comment.comment,
      likedBy: [],
      likedCount: comment.likedCount,
      taggedUserId: [],
      createdAt: comment.createdAt,
      updatedAt: new Date(),
    }));
  }
}

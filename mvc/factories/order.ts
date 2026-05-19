import {
  type TOrderSchema,
  type TCreateOrderFormSchema,
  type TUpdateOrderFormSchema,
  orderSchema,
  createOrderFormSchema,
  updateOrderFormSchema,
} from "../../shared/utils/schemas.zod";

import { BaseFactory } from "./base";
import { OrderEntity } from "../entities/order";
import { MenuItemEntity, OrderedItemEntity } from "../entities/item";
import { ApplicationError } from "../errors.appwide";

type TOrderDTO = Omit<TOrderSchema, "total"> & { customerId: string };
type TCreateOrderDTO = TCreateOrderFormSchema;
type TUpdateOrderDTO = TUpdateOrderFormSchema;

export class OrderFactory extends BaseFactory<TOrderDTO, OrderEntity> {
  protected build(data: TOrderDTO): OrderEntity {
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
}

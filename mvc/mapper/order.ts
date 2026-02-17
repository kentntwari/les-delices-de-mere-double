import { BaseMapper } from "./base";

import type {
  OrderModel,
  TCreateOrderItemParam,
  TCreateOrderDeliveryInfo,
} from "../repository/order";
import type {
  TOrderSchema,
  TCreateOrderFormSchema,
} from "../../shared/utils/schemas.zod";

import { OrderEntity } from "../entities/order";
import { OrderedItemEntity } from "../entities/item";

export type TOrderDTO = TOrderSchema & {
  status: OrderEntity["status"];
  paymentStatus: OrderEntity["paymentStatus"];
};
export class OrderMapper extends BaseMapper<
  OrderEntity,
  TOrderDTO,
  OrderModel
> {
  toEntity(data: OrderModel): OrderEntity {
    return new OrderEntity(
      data.id,
      data.customerId || "UNKNOWN_CUSTOMER_ID",
      // FIX: This should come from a ItemMapper or similar
      data.items.map(
        ({ id, orderId, item, quantity }) =>
          new OrderedItemEntity(
            id,
            orderId ?? "",
            item.title,
            "",
            item.unitPrice,
            quantity,
          ),
      ),
      data.status,
      data.paymentStatus,
    );
  }

  toEntityList(data: OrderModel[]): OrderEntity[] {
    return data.map((order) => this.toEntity(order));
  }

  toSafeModel(entity: OrderEntity): Partial<OrderModel> {
    return {
      id: entity.id,
      customerId: entity.customerId,
      status: entity.status,
      paymentStatus: entity.paymentStatus,
    };
  }

  toDto(entity: OrderEntity): TOrderDTO {
    return {
      id: entity.id,

      items: entity.items.map((item) => ({
        id: item.id,
        title: item.title,
        unitPrice:
          typeof item.unitPrice === "number"
            ? item.unitPrice
            : parseFloat(item.unitPrice),
        quantity: item.quantity,
      })),
      status: entity.status,
      paymentStatus: entity.paymentStatus,
      total: entity.totalAmount.toString(),
    };
  }

  toDtoList(entities: OrderEntity[]): TOrderDTO[] {
    return entities.map((entity) => this.toDto(entity));
  }

  toCreateOrderItems(
    items: TCreateOrderFormSchema["items"],
  ): TCreateOrderItemParam[] {
    return items.map((item) => ({
      itemId: item.id,
      quantity: item.quantity,
      itemUnitPrice: item.unitPrice,
    }));
  }

  toDeliveryInfo(
    delivery: TCreateOrderFormSchema["delivery"],
  ): TCreateOrderDeliveryInfo {
    return {
      isRequested: delivery.isRequired,
      fee: delivery.minimumFee,
    };
  }
}

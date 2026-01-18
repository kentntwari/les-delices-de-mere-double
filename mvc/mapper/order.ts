import { BaseMapper } from "./base";

import type { OrderModel } from "../repository/order";
import type { TOrderSchema as TOrderDTO } from "../../shared/utils/schemas.zod";

import { OrderEntity } from "../entities/order";
import { OrderedItemEntity } from "../entities/item";

export class OrderMapper extends BaseMapper<
  OrderEntity,
  TOrderDTO,
  OrderModel
> {
  toEntity(data: OrderModel): OrderEntity {
    return new OrderEntity(
      data.id,
      data.customerId || "UNKNOWN_CUSTOMER_ID",
      // FIX: This shoudl come from a ItemMapper or similar
      data.items.map(
        ({ id, orderId, item, quantity }) =>
          new OrderedItemEntity(
            id,
            orderId ?? "",
            item.title,
            "",
            item.unitPrice,
            quantity
          )
      ),
      data.status,
      data.paymentStatus
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
      total: entity.totalAmount.toString(),
    };
  }

  toDtoList(entities: OrderEntity[]): TOrderDTO[] {
    return entities.map((entity) => this.toDto(entity));
  }
}

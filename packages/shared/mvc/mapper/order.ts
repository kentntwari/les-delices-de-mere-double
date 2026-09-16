import { BaseMapper } from "./base";

import { OrderEntity, OrderLogEntity } from "../entities/order";
import { OrderedItemEntity } from "../entities/item";
import { OrderFactory } from "../factories/order";

import type { OrderModel, OrderLogModel } from "../repository/order";
import type { TOrderSchema } from "../../utils/schemas.zod";

export type TOrderDTO = TOrderSchema & {
  status: OrderEntity["status"];
  paymentStatus: OrderEntity["paymentStatus"];
};

export type TOrderLogDTO = Pick<OrderLogEntity, "message" | "createdAt">;

export class OrderMapper extends BaseMapper<
  OrderEntity,
  TOrderDTO,
  OrderModel
> {
  toEntity(data: OrderModel): OrderEntity {
    const o = OrderFactory.fromModel(data);
    if (data.deliveryFee) o.deliveryFee = data.deliveryFee.toString();
    return o;
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

  fromDto(
    dto: TOrderDTO,
    customerId?: string,
    deliveryStatus?: "requested" | "not-requested",
  ): OrderEntity {
    const o = new OrderEntity(
      dto.id,
      customerId ?? "UNKNOWN_CUSTOMER_ID",
      dto.items.map(
        (item) =>
          new OrderedItemEntity(
            item.id,
            dto.id,
            item.title,
            "",
            item.unitPrice,
            item.quantity,
          ),
      ),
      dto.status,
      dto.paymentStatus,
      deliveryStatus ?? "not-requested",
    );

    return o;
  }

  toDtoList(entities: OrderEntity[]): TOrderDTO[] {
    return entities.map((entity) => this.toDto(entity));
  }

  fromDtoList(
    dtos: TOrderDTO[],
    customerId?: string,
    deliveryStatus?: "requested" | "not-requested",
  ): OrderEntity[] {
    return dtos.map((dto) => this.fromDto(dto, customerId, deliveryStatus));
  }

  toLogEntity(data: OrderLogModel): OrderLogEntity {
    return new OrderLogEntity(
      data.id,
      data.message,
      data.createdAt.toISOString(),
    );
  }

  toLogEntityList(data: OrderLogModel[]): OrderLogEntity[] {
    return data.map((log) => this.toLogEntity(log));
  }

  toLogDto(entity: OrderLogEntity): TOrderLogDTO {
    return {
      message: entity.message,
      createdAt: entity.createdAt,
    };
  }

  toLogDtoList(entities: OrderLogEntity[]): TOrderLogDTO[] {
    return entities.map((entity) => this.toLogDto(entity));
  }
}

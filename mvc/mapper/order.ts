import { BaseMapper } from "./base";

import {
  OrderEntity,
  OrderCommentEntity,
  OrderLogEntity,
} from "../entities/order";
import { OrderedItemEntity } from "../entities/item";
import { OrderFactory } from "../factories/order";

import type {
  OrderModel,
  OrderCommentModel,
  OrderLogModel,
} from "../repository/order";
import type { TOrderSchema } from "../../shared/utils/schemas.zod";

export type TOrderDTO = TOrderSchema & {
  status: OrderEntity["status"];
  paymentStatus: OrderEntity["paymentStatus"];
};

export type TOrderLogDTO = Pick<OrderLogEntity, "message" | "createdAt">;

export type TOrderCommentDTO = Pick<
  OrderCommentEntity,
  "id" | "comment" | "userName" | "likedCount" | "createdAt"
>;

type TTaggedUserId = string;
export type TOrderCommentDetailsDTO = {
  id: string;
  user_name: string | undefined;
  comment: string;
  taggedUsers: TTaggedUserId[];
  likedBy: TTaggedUserId[];
  likedCount: number;
  createdAt: string;
};

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

  toCommentEntity(data: OrderCommentModel): OrderCommentEntity {
    const e = new OrderCommentEntity(
      data.id,
      data.comment,
      data.orderId,
      data.userId,
      data.createdAt.toISOString(),
    );

    e.userName = data.user_name || "";

    return e;
  }

  toCommentEntityList(data: OrderCommentModel[]): OrderCommentEntity[] {
    return data.map((comment) => this.toCommentEntity(comment));
  }

  toCommentDto(entity: OrderCommentEntity): TOrderCommentDTO {
    return {
      id: entity.id,
      comment: entity.comment,
      userName: entity.userName,
      likedCount: entity.likedCount,
      createdAt: entity.createdAt,
    };
  }

  toCommentDtoList(entities: OrderCommentEntity[]): TOrderCommentDTO[] {
    return entities.map((entity) => this.toCommentDto(entity));
  }
}

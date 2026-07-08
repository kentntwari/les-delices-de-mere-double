import type {
  TCreateOrderFormSchema,
  TUpdateOrderFormSchema,
} from "../../shared/utils/schemas.zod";
import { CustomerFactory } from "../factories/customer";
import {
  OrderCommentFactory,
  OrderFactory,
  OrderLogFactory,
} from "../factories/order";
import { CustomerMapper } from "../mapper/customer";
import { OrderMapper } from "../mapper/order";

import { OrderRepository } from "../repository/order";

const orderMapper = new OrderMapper();
const cxMapper = new CustomerMapper();
export class OrderTransformer {
  private static hasRequestedDelivery(fee: number | string | null | undefined) {
    if (fee === null || fee === undefined) return false;

    const normalizedFee =
      typeof fee === "number" ? fee : Number.parseFloat(fee);

    return Number.isFinite(normalizedFee) && normalizedFee > 0;
  }

  static toCreateParams(data: TCreateOrderFormSchema["items"]) {
    return data.map((item) => ({
      itemId: item.id,
      quantity: item.quantity,
      itemUnitPrice: item.unitPrice,
    }));
  }

  static toCountMetadata(
    model: Awaited<
      ReturnType<typeof OrderRepository.prototype.getCountMetadata>
    >,
  ) {
    if (model.length === 0) return null;
    return {
      comments: model.at(0)!.comment_count,
      logs: model.at(0)!.log_count,
      items: model.at(0)!.item_count,
    };
  }

  static toDeliveryDetails(
    model: Awaited<
      ReturnType<typeof OrderRepository.prototype.getDeliveryDetails>
    >,
  ) {
    if (!model) return { isRequested: false };
    if (!this.hasRequestedDelivery(model.fees?.total))
      return { isRequested: false };

    return {
      isRequested: true,
      fee: model.fees!.total,
      address: model.address,
    };
  }

  static toUpdateParams(data: TUpdateOrderFormSchema) {
    return {
      id: data.id,
      items: [...data.items.current, ...data.items.added],
      deliveryAddress:
        data.delivery.isRequired && data.delivery.address
          ? data.delivery.address
          : null,
    };
  }

  static toPreview(
    model: Awaited<ReturnType<typeof OrderRepository.prototype.getPreview>>,
  ) {
    if (!model) return null;
    const o = orderMapper.toEntity(OrderFactory.fromPreview(model));
    const b = orderMapper.toCommentEntityList(
      OrderCommentFactory.fromOrderPreview(model),
    );
    const l = orderMapper.toLogEntityList(
      OrderLogFactory.fromOrderPreview(model),
    );
    const cx = cxMapper.toEntity(CustomerFactory.fromOrderPreview(model));
    return {
      order: orderMapper.toDto(o),
      customer: cxMapper.toDto(cx),
      logs: orderMapper.toLogDtoList(l),
      comments: orderMapper.toCommentDtoList(b),
      timeline: {
        createdAt: model.createdAt.toISOString(),
        updatedAt: model.updatedAt.toISOString(),
      },
    };
  }
}

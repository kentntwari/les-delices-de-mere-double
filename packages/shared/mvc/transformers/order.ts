import type {
  TCreateOrderFormSchema,
  TUpdateOrderFormSchema,
} from "../../utils/schemas.zod";
import { CustomerFactory } from "../factories/customer";
import { OrderFactory, OrderLogFactory } from "../factories/order";
import { OrderCommentFactory } from "../factories/comment";
import { CustomerMapper } from "../mapper/customer";
import { OrderMapper } from "../mapper/order";
import { OrderCommentMapper } from "../mapper/comment";

import type {
  OrderCountMetadataModel,
  OrderDeliveryDetailsModel,
  OrderPreviewModel,
} from "../repository/order";

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

  static toCountMetadata(model: OrderCountMetadataModel) {
    if (model.length === 0) return null;
    return {
      comments: model.at(0)!.comment_count,
      logs: model.at(0)!.log_count,
      items: model.at(0)!.item_count,
    };
  }

  static toDeliveryDetails(model: OrderDeliveryDetailsModel) {
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

  static toPreview(model: OrderPreviewModel) {
    if (!model) return null;

    const orderMapper = new OrderMapper();
    const orderCommentMapper = new OrderCommentMapper();
    const cxMapper = new CustomerMapper();

    const o = orderMapper.toEntity(OrderFactory.fromPreview(model));
    const b = orderCommentMapper.toEntityList(
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
      comments: orderCommentMapper.toDtoList(b),
      timeline: {
        createdAt: model.createdAt.toISOString(),
        updatedAt: model.updatedAt.toISOString(),
      },
    };
  }
}

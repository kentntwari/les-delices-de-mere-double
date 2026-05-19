import type {
  TCreateOrderFormSchema,
  TUpdateOrderFormSchema,
} from "../../shared/utils/schemas.zod";

import { OrderRepository, type OrderModel } from "../repository/order";

export class OrderTransformer {
  static toCreateOrderParams(data: TCreateOrderFormSchema["items"]) {
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
    if (!model.fees?.total) return { isRequested: false };
    else
      return {
        isRequested: true,
        fee: model.fees.total,
        address: model.address,
      };
  }

  static toOrderUpdateParams(data: TUpdateOrderFormSchema) {
    return {
      id: data.id,
      items: [...data.items.current, ...data.items.added],
      deliveryAddress:
        data.delivery.isRequired && data.delivery.address
          ? data.delivery.address
          : null,
    };
  }
}

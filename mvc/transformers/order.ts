import type { TCreateOrderFormSchema } from "../../shared/utils/schemas.zod";

import { OrderRepository } from "../repository/order";

export class OrderTransformer {
  static toCreateOrderParams(data: TCreateOrderFormSchema["items"]) {
    return data.map((item) => ({
      itemId: item.id,
      quantity: item.quantity,
      itemUnitPrice: item.unitPrice,
    }));
  }

  static toCreateOrderDeliveryInfo(data: TCreateOrderFormSchema["delivery"]) {
    if (!data?.isRequired) return null;
    return {
      isRequested: data.isRequired,
      fee: data.minimumFee,
    };
  }

  static toCountMetadata(
    data: Awaited<
      ReturnType<typeof OrderRepository.prototype.getCountMetadata>
    >,
  ) {
    if (data.length === 0) return null;
    return {
      comments: data.at(0)!.comment_count,
      logs: data.at(0)!.log_count,
      items: data.at(0)!.item_count,
    };
  }
}

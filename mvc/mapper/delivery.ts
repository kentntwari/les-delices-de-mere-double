import type {
  DeliveryAddressModel,
  DeliveryModel,
  OrderDeliveryAddressModel,
} from "../repository/delivery";

import { BaseMapper } from "./base";

import { DeliveryFactory } from "../factories/delivery";

export class DeliveryMapper {
  fromDeliveryAddress(data: DeliveryAddressModel): DeliveryModel {
    return {
      address: data,
      fees: undefined,
      _meta: { order: undefined, customer: undefined },
    };
  }
  fromOrderDelivery(data: OrderDeliveryAddressModel): DeliveryModel {
    return {
      address: {
        id: data.deliveryAddress?.id || DeliveryFactory.defaultAddress.id,
        city: data.deliveryAddress?.city || DeliveryFactory.defaultAddress.city,
        postalCode:
          data.deliveryAddress?.postalCode ||
          DeliveryFactory.defaultAddress.postalCode,
        state:
          data.deliveryAddress?.state || DeliveryFactory.defaultAddress.state,
        street:
          data.deliveryAddress?.street || DeliveryFactory.defaultAddress.street,
        country:
          data.deliveryAddress?.country ||
          DeliveryFactory.defaultAddress.country,
      },
      fees: data.order?.deliveryFee
        ? { total: data.order.deliveryFee }
        : undefined,
      _meta: {
        order: data.order
          ? {
              id: data.order.id,
              isPaid: data.order.paymentStatus === "PAID",
              orderDeliveryId: data.id,
            }
          : undefined,
        customer: data.order?.customer
          ? {
              id: data.order.customer.id,
              homeAddress: data.order.customer.homeAddress,
            }
          : undefined,
      },
    };
  }
}

import type {
  DeliveryAddressModel,
  DeliveryModel,
} from "../repository/delivery";

export class DeliveryFactory {
  public static defaultAddress: DeliveryAddressModel = {
    id: "PLACEHOLDER_ID",
    street: "123 Main St",
    city: "Anytown",
    state: "Anystate",
    postalCode: "12345",
    country: "USA",
  };
}

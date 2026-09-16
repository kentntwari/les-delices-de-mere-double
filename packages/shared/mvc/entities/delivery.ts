export class DeliveryEntity {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly deliveryAddress: string,
    public readonly deliveryTime: string,
    public readonly status: "requested" | "not-requested",
  ) {}
}

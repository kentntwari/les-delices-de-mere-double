import { ItemEntity } from "./item";
import { type Order as OrderModel } from "@prisma/client";

export class OrderEntity implements Pick<OrderModel, "id" | "customerId"> {
  private _totalAmount: string | undefined = undefined;

  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public items: ItemEntity[],
    public _status: string = "IN_PROGRESS",
    public _paymentStatus: string = "UNPAID",
    public isToBeDelivered: boolean = false,
    public deliveryFee: string | number = 20
  ) {
    this.calculateTotalAmount();
  }

  calculateTotalAmount(): string {
    const total = this.items.reduce((sum, item) => {
      const price =
        typeof item.price === "number" ? item.price : parseFloat(item.price);
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    this._totalAmount = total > 0 ? total.toFixed(2) : "0.00";
    return this._totalAmount;
  }

  addItem(item: ItemEntity): void {
    this.items.push(item);
    this.calculateTotalAmount();
  }

  removeItem(itemId: string): void {
    this.items = this.items.filter((i) => i.id !== itemId);
    this.calculateTotalAmount();
  }
}

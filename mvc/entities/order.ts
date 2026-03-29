import { OrderedItemEntity } from "./item";
import {
  type OrderModel,
  type OrderCommentModel,
  type OrderLogModel,
} from "../repository/order";

export class OrderLogEntity implements Omit<
  OrderLogModel,
  "orderId" | "createdAt"
> {
  constructor(
    public readonly id: string,
    public readonly message: string,
    public readonly createdAt: string,
  ) {}
}

export class OrderCommentEntity implements Omit<
  OrderCommentModel,
  "user" | "userId" | "orderId" | "taggedUserId" | "likedBy" | "createdAt"
> {
  constructor(
    public readonly id: string,
    public readonly comment: string,
    public readonly userId: string | undefined,
    public readonly userName: string | undefined,
    public readonly likedCount: number,
    public readonly createdAt: string,
  ) {}
}

export class OrderEntity implements Pick<OrderModel, "id" | "customerId"> {
  private _totalAmount: string = "0.00";

  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public items: OrderedItemEntity[],
    public status: OrderModel["status"] = "IN_PROGRESS",
    public paymentStatus: OrderModel["paymentStatus"] = "UNPAID",
  ) {
    this.calculateTotalAmount();
  }

  get totalAmount(): string {
    return this._totalAmount;
  }

  private calculateTotalAmount(): string {
    const total = this.items.reduce((sum, item) => {
      const price = item.unitPrice * item.quantity;
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    this._totalAmount = total > 0 ? total.toFixed(2) : "0.00";
    return this._totalAmount;
  }

  addItem(item: OrderedItemEntity): void {
    this.items.push(item);
    this.calculateTotalAmount();
  }

  removeItem(itemId: string): void {
    this.items = this.items.filter((i) => i.id !== itemId);
    this.calculateTotalAmount();
  }
}

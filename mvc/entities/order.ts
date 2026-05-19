import { OrderedItemEntity } from "./item";
import {
  type OrderModel,
  type OrderCommentModel,
  type OrderLogModel,
} from "../repository/order";

interface IOrderEntity extends Pick<OrderModel, "id" | "customerId"> {}
interface IOrderLogEntity extends Omit<
  OrderLogModel,
  "orderId" | "createdAt"
> {}
interface IOrderCommentEntity extends Omit<
  OrderCommentModel,
  "user" | "userId" | "orderId" | "taggedUserId" | "likedBy" | "createdAt"
> {}

export class OrderLogEntity implements IOrderLogEntity {
  constructor(
    public readonly id: string,
    public readonly message: string,
    public readonly createdAt: string,
  ) {}
}

export class OrderCommentEntity implements IOrderCommentEntity {
  constructor(
    public readonly id: string,
    public readonly comment: string,
    public readonly userId: string | undefined,
    public readonly userName: string | undefined,
    public readonly likedCount: number,
    public readonly createdAt: string,
  ) {}
}

export class OrderEntity implements IOrderEntity {
  protected _totalAmount: string = "0.00";
  protected _deliveryFee: string = "10.00";
  protected _totalItemsAmount: string = "0.00";
  protected _deliveryStatus: "requested" | "not-requested" = "not-requested";

  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public items: OrderedItemEntity[],
    public status: OrderModel["status"] = "IN_PROGRESS",
    public paymentStatus: OrderModel["paymentStatus"] = "UNPAID",
    deliveryStatus: "requested" | "not-requested" = "not-requested",
  ) {
    this._deliveryStatus = deliveryStatus;
    this.calculateTotalAmount();
  }

  get totalAmount(): string {
    return this._totalAmount;
  }

  get deliveryFee(): string {
    return this._deliveryFee;
  }

  set deliveryFee(fee: string) {
    const parsedFee = parseFloat(fee);
    this._deliveryFee =
      isNaN(parsedFee) || parsedFee < 0 ? "0.00" : parsedFee.toFixed(2);
    this.calculateTotalAmount();
  }

  get deliveryStatus(): "requested" | "not-requested" {
    return this._deliveryStatus;
  }

  set deliveryStatus(status: "requested" | "not-requested") {
    this._deliveryStatus = status;
    this.calculateTotalAmount();
  }

  private calculateTotalAmount() {
    const total = this.items.reduce((sum, item) => {
      const price = item.unitPrice * item.quantity;
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    this._totalItemsAmount = total > 0 ? total.toFixed(2) : "0.00";
    if (this._deliveryStatus === "not-requested") this._deliveryFee = "0.00";
    this._totalAmount = (
      parseFloat(this._totalItemsAmount) + parseFloat(this._deliveryFee)
    ).toFixed(2);
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

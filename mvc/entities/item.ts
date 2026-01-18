import type { OrderedItemModel, MenuItemModel } from "../repository/item";

import s from "slugify";

export class OrderedItemEntity implements Partial<OrderedItemModel> {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly title: string,
    public readonly slug: string,
    public readonly unitPrice: number,
    public quantity: number
  ) {}

  get total(): number {
    return this.unitPrice * this.quantity;
  }
}

export class MenuItemEntity
  implements Omit<MenuItemModel, "description" | "slug">
{
  constructor(
    public readonly id: string,
    public title: string,
    public slug: string | undefined,
    public unitPrice: number
  ) {
    const isSlugEmpty = !this.slug || this.slug.trim() === "";
    if (isSlugEmpty) this.generateSlug();
  }

  generateSlug(): void {
    this.slug = s(this.title, { lower: true, strict: true });
  }

  static generateID(): string {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const n = (buf.at(0) ?? 0) % 10000;
    return `MI${n.toString().padStart(4, "0")}`;
  }
}

import type { MenuItem as ItemModel } from "@prisma/client";

import s from "slugify";

export class ItemEntity implements Pick<ItemModel, "id" | "title" | "price"> {
  protected _slug: string = "unspecified-slug";

  constructor(
    public readonly id: string,
    public title: string,
    public price: number
  ) {
    this.generateSlug();
  }

  generateSlug(): void {
    this._slug = s(this.title, { lower: true, strict: true });
  }
}

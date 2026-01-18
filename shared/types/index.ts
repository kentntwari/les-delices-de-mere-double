import type { User as UserModel } from "@prisma/client";

export interface IUserMeta {
  status: UserModel["status"];
  role: UserModel["role"];
}

export interface IMenuItemsCustomRequestHeaders {
  "X-Update-Title"?: "true" | "false";
  "X-Update-Pricing"?: "true" | "false";
}

import type { User as UserModel } from "@prisma/client";
import type { TOrderDTO } from "~~/mvc/mapper/order";
import type {
  TCustomerSchema as TCustomerDTO,
  TAddressSchema,
} from "../utils/schemas.zod";

import { OrderTransformer } from "../../mvc/transformers/order";
export interface IUserMeta {
  status: UserModel["status"];
  role: UserModel["role"];
}

export interface IMenuItemsCustomRequestHeaders {
  "X-Update-Title"?: "true" | "false";
  "X-Update-Pricing"?: "true" | "false";
}

export type TOrderRelatedCustomer = Pick<
  TCustomerDTO,
  "fullName" | "phone" | "email"
>;

export type TPreviewedOrderMetadata = {
  count: ReturnType<typeof OrderTransformer.toCountMetadata>;
  delivery: {
    isRequested: boolean;
    fee: string;
    address: TAddressSchema | null;
  };
};

export interface IApiOrderData extends TOrderDTO {
  _meta: {
    customer: {
      id: string;
      name: string;
    } | null;
    delivery: {
      status: "isRequested" | "notRequested";
      fees: { total: string };
    } | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
}

export interface IApiOrderCommentData {
  id: string;
  comment: string;
  _meta: {
    likedCount: number;
    createdBy: string;
    createdAt: string;
  };
}

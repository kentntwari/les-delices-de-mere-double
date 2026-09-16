import type { $Enums, User as UserModel } from "@prisma/client";
import type {
  TOrderSchema,
  TCustomerSchema as TCustomerDTO,
  TAddressSchema,
} from "../utils/schemas.zod";

export interface IUserMeta {
  status: UserModel["status"];
  role: UserModel["role"];
}

export type TOrderDTO = TOrderSchema & {
  status: $Enums.OrderStatus;
  paymentStatus: $Enums.PaymentStatus;
};

export interface TOrderLogDTO {
  message: string;
  createdAt: string;
}

export interface IOrderPreviewItemModel {
  itemId?: string | null;
  quantity: number;
  item: {
    id: string;
    title: string;
    slug: string;
    unitPrice: number;
  } | null;
}

export interface IOrderPreviewCommentModel {
  id: string;
  source: string | null;
  comment: string;
  likedCount: number;
  createdAt: Date;
  user: {
    id: string;
    name: string;
  } | null;
}

export interface IOrderPreviewLogModel {
  id: string;
  message: string;
  createdAt: Date;
}

export interface TOrderPreviewRepositoryModel {
  id: string;
  status: $Enums.OrderStatus;
  paymentStatus: $Enums.PaymentStatus;
  deliveryFee: number | null;
  createdAt: Date;
  updatedAt: Date;
  items: IOrderPreviewItemModel[];
  orderComments: IOrderPreviewCommentModel[];
  logs: IOrderPreviewLogModel[];
  customer: {
    id: string;
    name: string;
  } | null;
}

export interface IOrderCountMetadata {
  comments: number | string;
  logs: number | string;
  items: number | string;
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
  count: IOrderCountMetadata | null;
  delivery: {
    isRequested: boolean;
    fee: string;
    address: TAddressSchema | null;
  };
};

export interface IApiOrderData extends TOrderDTO {
  _meta: {
    _itemsCount?: number;
    _commentsCount?: number;
    _logsCount?: number;
    logs: TOrderLogDTO[] | null;
    comments: IApiOrderCommentData[] | null;
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
    source: string | null;
    mentionedUsers: string[];
    likedCount: number;
    createdBy: string;
    createdAt: string;
  };
}

export interface IApiOrderCommentDeletedData {
  id: string;
}

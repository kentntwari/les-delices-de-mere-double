import type {
  TOrderRelatedCustomer,
  TPreviewedOrderMetadata,
} from "~~/shared/types";

import { CacheMapUtil } from "~~/shared/utils/cacheMap";

export class OrderRelatedCustomerMap extends CacheMapUtil<
  `order-related-customer__${string}`,
  TOrderRelatedCustomer
> {
  protected max: number = 5;
}

export class OrderMetadataMap extends CacheMapUtil<
  `order-metadata__${string}`,
  TPreviewedOrderMetadata
> {
  protected max: number = 20;
}

export const orderRelatedCustomerMap = new OrderRelatedCustomerMap();

export const orderMetadataMap = new OrderMetadataMap();

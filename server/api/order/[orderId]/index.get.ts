import { type H3Event } from "h3";

import { createRequestLogger } from "~~/server/utils/logger";
import { JsonResponse } from "~~/mvc/controllers/base";
import { OrderController } from "~~/mvc/controllers/order";
import { type IApiOrderData } from "~~/shared/types";
import { DateUtils } from "~~/shared/utils/date";

const log = createRequestLogger("server.api.order.[orderId].index.get.ts");
const ORDER_CACHE_MAX_AGE = 60 * 30;

export default defineEventHandler(async (event) => {
  try {
    const orderId = getRouterParam(event, "orderId");

    if (!orderId) {
      log.error(
        event.path,
        event.method,
        {
          group: "orders",
          orderId,
        },
        "GET REQUEST RECEIVED: Missing orderId parameter",
      );
      return createError({
        statusCode: 400,
        message: "Missing orderId parameter",
      });
    }

    log.info(
      event.path,
      event.method,
      { params: { orderId } },
      "GET REQUEST RECEIVED: Fetching order preview and count metadata",
    );

    const [preview, count, comments] = await Promise.all([
      cachedOrderPreviewPayload(event, orderId),
      cachedOrderCountPayload(event, orderId),
      event.$fetch(`/api/order/${orderId}/comments`),
    ]);

    const resolveCountMetadata = !count?.data ? null : count.data;

    return {
      data: {
        id: preview.data.order.id,
        status: preview.data.order.status,
        paymentStatus: preview.data.order.paymentStatus,
        items: preview.data.order.items,
        total: preview.data.order.total,
        _meta: {
          _itemsCount: resolveCountMetadata
            ? parseInt(resolveCountMetadata.items)
            : preview.data.order.items.length,
          _commentsCount: resolveCountMetadata
            ? parseInt(resolveCountMetadata.comments)
            : preview.data.comments.length,
          _logsCount: resolveCountMetadata
            ? parseInt(resolveCountMetadata.logs)
            : preview.data.logs.length,

          logs: [...preview.data.logs],

          comments: comments ?? [],

          customer: {
            ...preview.data.customer,
          },
          delivery: !preview.data.delivery
            ? null
            : preview.data.delivery.isRequested
              ? {
                  status: "isRequested",
                  fees: {
                    total: `${preview.data.delivery.fee}`,
                  },
                }
              : {
                  status: "notRequested",
                  fees: {
                    total: "0",
                  },
                },
          createdAt: preview.data.timeline.createdAt,
          updatedAt: preview.data.timeline.updatedAt,
        },
      } satisfies IApiOrderData,
    };
  } catch (error) {
    log.error(
      event.path,
      event.method,
      { err: error, params: { orderId: getRouterParam(event, "orderId") } },
      "GET REQUEST FAILED: Failed to fetch order details",
    );
    return treatErrors(error, "server/api/order/[orderId]/index.get.ts");
  }
});

const cachedOrderPreviewPayload = defineCachedFunction(
  async (event: H3Event, orderId: string) => {
    try {
      const response = await new OrderController(
        toWebRequest(event),
      ).extractPreview(orderId);

      if (response instanceof JsonResponse)
        return {
          data: {
            ...response.data.data,
            timeline: {
              createdAt: DateUtils.convertDate(
                new Date(response.data.data.timeline.createdAt),
              ),
              updatedAt: DateUtils.convertDate(
                new Date(response.data.data.timeline.updatedAt),
              ),
            },
          } satisfies typeof response.data.data,
        };

      log.warn(
        event.path,
        event.method,
        {
          params: { orderId },
          status: response.status,
          message: response.message,
        },
        "CACHE PREVIEW MISS WITH CONTROLLER ERROR RESPONSE",
      );

      throw response;
    } catch (error) {
      log.error(
        event.path,
        event.method,
        { err: error, params: { orderId } },
        "CACHE PREVIEW FAILED: Unhandled error during cached preview fetch",
      );
      throw error;
    }
  },
  {
    maxAge: ORDER_CACHE_MAX_AGE,
    swr: true,
    name: "order",
    getKey: (event: H3Event, orderId: string) => `order_preview_${orderId}`,
  },
);

const cachedOrderCountPayload = defineCachedFunction(
  async (event: H3Event, orderId: string) => {
    try {
      const response = await new OrderController(
        toWebRequest(event),
      ).handleIntent("get-order-count-metadata", orderId);

      if (response instanceof JsonResponse) return response.data;

      log.warn(
        event.path,
        event.method,
        {
          params: { orderId },
          status: response.status,
          message: response.message,
        },
        "CACHE COUNT MISS WITH CONTROLLER ERROR RESPONSE",
      );

      throw response;
    } catch (error) {
      log.error(
        event.path,
        event.method,
        { err: error, params: { orderId } },
        "CACHE COUNT FAILED: Unhandled error during cached metadata fetch",
      );

      throw error;
    }
  },
  {
    maxAge: ORDER_CACHE_MAX_AGE,
    swr: true,
    name: "order",
    getKey: (event: H3Event, orderId: string) => `order_count_${orderId}`,
  },
);

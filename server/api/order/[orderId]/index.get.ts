import { H3Event } from "h3";
import { createRequestLogger } from "~~/server/utils/logger";
import { JsonResponse } from "~~/mvc/controllers/base";
import { CustomerController } from "~~/mvc/controllers/customer";
import { OrderController } from "~~/mvc/controllers/order";
import { type IApiOrderData } from "~~/shared/types";

const log = createRequestLogger("server.api.order.[orderId].index.get.ts");

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

    const request = toWebRequest(event);
    const orderController = new OrderController(request);
    const customerController = new CustomerController(request);

    const orderData = await orderController.read(orderId);

    if (!(orderData instanceof JsonResponse)) return treatErrors(orderData);

    const [customerInfo, deliveryInfo, timelineInfo] = await retrieveDetails(
      event,
      customerController,
      orderController,
      orderId,
    );

    return {
      data: {
        id: orderData.data.data.id,
        status: orderData.data.data.status,
        paymentStatus: orderData.data.data.paymentStatus,
        items: orderData.data.data.items,
        total: orderData.data.data.total,
        _meta: {
          customer: !customerInfo
            ? null
            : {
                id: customerInfo.id,
                name: customerInfo.fullName,
              },
          delivery: !deliveryInfo
            ? null
            : deliveryInfo.isRequested
              ? {
                  status: "isRequested",
                  fees: {
                    total: `${deliveryInfo.fee}`,
                  },
                }
              : {
                  status: "notRequested",
                  fees: {
                    total: "0",
                  },
                },
          createdAt: timelineInfo?.createdAt ?? null,
          updatedAt: timelineInfo?.updatedAt ?? null,
        },
      } satisfies IApiOrderData,
    };
  } catch (error) {
    return treatErrors(error);
  }
});

function retrieveDetails(
  event: H3Event,
  customerController: CustomerController,
  orderController: OrderController,
  orderId: string,
) {
  return Promise.all([
    (async () => {
      const customerResult = await orderController.handleIntent(
        "get-order-customer",
        orderId,
      );

      const customerId =
        customerResult instanceof JsonResponse
          ? customerResult.data.data.id
          : null;

      if (!customerId) return null;

      try {
        const result = await customerController.read(customerId);

        if (!(result instanceof JsonResponse)) {
          treatErrors(result);
          return null;
        }

        return {
          id: customerId,
          fullName: result.data.data.fullName,
          phone: result.data.data.phone,
          email: result.data.data.email,
        };
      } catch (error) {
        log.warn(
          event.path,
          event.method,
          {
            group: "orders",
            orderId,
            customerId,
          },
          "GET REQUEST: Failed to resolve customer metadata for order",
        );

        return null;
      }
    })(),
    (async () => {
      try {
        const result = await orderController.handleIntent(
          "get-order-delivery-details",
          orderId,
        );

        if (!(result instanceof JsonResponse)) {
          treatErrors(result);
          return null;
        }

        return result.data.data;
      } catch (error) {
        log.warn(
          event.path,
          event.method,
          {
            group: "orders",
            orderId,
          },
          "GET REQUEST: Failed to resolve delivery metadata for order",
        );

        return null;
      }
    })(),
    (async () => {
      try {
        const result = await orderController.handleIntent(
          "get-order-timeline",
          orderId,
        );

        if (!(result instanceof JsonResponse)) {
          treatErrors(result);
          return null;
        }

        return result.data.data;
      } catch (error) {
        log.warn(
          event.path,
          event.method,
          {
            group: "orders",
            orderId,
          },
          "GET REQUEST: Failed to resolve timeline metadata for order",
        );

        return null;
      }
    })(),
  ]);
}

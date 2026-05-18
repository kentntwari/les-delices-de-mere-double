import type { TOrderRelatedCustomer } from "~~/shared/types";
import { OrderController } from "~~/mvc/controllers/order";
import { CustomerController } from "~~/mvc/controllers/customer";

import { JsonResponse } from "~~/mvc/controllers/base";

const log = createRequestLogger(
  "server.api.order.[orderId].metadata.customer.get.ts",
);

export default defineEventHandler(async (event) => {
  try {
    const { orderId } = event.context.params as { orderId: string };

    log.info(
      event.path,
      event.method,
      {
        param: { orderId },
      },
      "GET REQUEST RECEIVED: Getting order customer",
    );

    const r = await new OrderController(toWebRequest(event)).handleIntent(
      "get-order-customer",
      orderId,
    );

    if (!(r instanceof JsonResponse)) return treatResponses(event, r);

    const b = await $fetch<{
      data: Awaited<ReturnType<typeof CustomerController.prototype.read>>;
    }>(`/api/customer/${r.data.data.id}`);

    if (!(b instanceof JsonResponse)) return treatResponses(event, b.data);

    return {
      data: {
        fullName: b.data.fullName,
        phone: b.data.phone,
        email: b.data.email,
      } satisfies TOrderRelatedCustomer,
    };
  } catch (error) {
    return treatErrors(error);
  }
});

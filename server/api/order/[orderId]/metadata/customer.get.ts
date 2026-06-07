import type { TOrderRelatedCustomer } from "~~/shared/types";
import type { TCustomerFullDTO } from "~~/mvc/mapper/customer";
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

    if (!(r instanceof JsonResponse)) return treatErrors(r);

    const b = await $fetch<{ data: TCustomerFullDTO }>(
      `/api/customer/${r.data.data.id}`,
    );

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

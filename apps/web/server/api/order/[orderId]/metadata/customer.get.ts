import type { TOrderRelatedCustomer } from "#shared/types";
import { OrderController } from "@repo/shared/mvc/controllers/order";
import { CustomerEntity } from "@repo/shared/mvc/entities/customer";
import type { TCustomerFullDTO } from "@repo/shared/mvc/mapper/customer";

import { JsonResponse } from "@repo/shared/mvc/controllers/base";

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

    const b = await event.$fetch<{
      data: TCustomerFullDTO;
    }>(`/api/customer/${r.data.data.id}`);

    return {
      data: {
        fullName: b.data.fullName,
        phone: CustomerEntity.parsePhone(b.data.phone),
        email: b.data.email,
      } satisfies TOrderRelatedCustomer,
    };
  } catch (error) {
    return treatErrors(error);
  }
});

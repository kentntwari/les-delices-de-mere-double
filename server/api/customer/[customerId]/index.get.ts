import { CustomerController } from "../../../../mvc/controllers/customer";

const log = createRequestLogger(
  "server.api.customers.[customerId].index.get.ts",
);

export default defineCachedEventHandler(
  async (event) => {
    try {
      log.info(
        event.path,
        event.method,
        null,
        "GET REQUEST RECEIVED: Reading customer",
      );

      const customerId = getRouterParam(event, "customerId");

      if (!customerId) {
        log.warn(
          event.path,
          event.method,
          { customerId },
          "GET REQUEST Missing customerId in path parameters",
        );
        throw createError({
          statusCode: 400,
          message: "Missing customerId in path parameters",
        });
      }

      const r = await new CustomerController(toWebRequest(event)).read(
        customerId,
      );

      return treatResponses(event, r);
    } catch (error) {
      treatErrors(error);
    }
  },
  {
    name: "customer",
    maxAge: 60 * 60 * 24, // 24 hours
    swr: true,
    getKey: (event) => {
      const customerId = getRouterParam(event, "customerId");
      if (!customerId) return "customerId_missing";
      return `customerId_${encodeURIComponent(customerId.toLowerCase())}`;
    },
  },
);

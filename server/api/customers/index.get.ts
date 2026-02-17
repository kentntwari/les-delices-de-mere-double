import { CustomerController } from "../../../mvc/controllers/customer";

const log = createRequestLogger("server.api.customers.index.get.ts");

export default defineEventHandler(async (event) => {
  try {
    log.info(
      event.path,
      event.method,
      null,
      "GET REQUEST RECEIVED: Reading customers",
    );
    const r = await new CustomerController(toWebRequest(event)).list();
    return treatResponses(event, r);
  } catch (error) {
    treatErrors(error);
  }
});

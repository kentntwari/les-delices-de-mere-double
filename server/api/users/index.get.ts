import { UserController } from "~~/mvc/controllers/user";

const log = createRequestLogger("/api/users/index.get.ts");

export default defineEventHandler(async (event) => {
  try {
    log.info(
      event.path,
      event.method,
      null,
      "GET REQUEST RECEIVED: Fetching all users",
    );

    const r = await new UserController(toWebRequest(event)).list();

    return treatResponses(event, r);
  } catch (error) {
    treatErrors(error, "/api/users/index.get.ts");
  }
});

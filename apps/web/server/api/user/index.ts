export default defineEventHandler(async (event) => {
  logger.warn(
    { file: "/api/user/index.ts" },
    "Not implemented endpoint called"
  );
  throw createError({ statusCode: 501, statusMessage: "Not implemented" });
});

import { clerkMiddleware } from "@clerk/nuxt/server";

const log = createLogger("server.middleware.authenticated");

function isProtectedApiPath(path: string): boolean {
  return (
    path.startsWith("/api/user/") ||
    path.startsWith("/api/items") ||
    path.startsWith("/api/item") ||
    path.startsWith("/api/orders") ||
    path.startsWith("/api/order") ||
    path.startsWith("/api/customers") ||
    path.startsWith("/api/customer")
  );
}

export default clerkMiddleware((event) => {
  if (event.path === "/api/webhook.clerk") return;

  if (!isProtectedApiPath(event.path)) return;

  const t = event.context.auth();

  if (t.userId) return;

  log.warn(
    {
      path: event.path,
      method: event.method,
    },
    "[UNAUTHENTICATED ACCESS]: Missing userId for protected API route",
  );

  throw createError({
    statusCode: 401,
    statusMessage: "Unauthenticated",
  });
});

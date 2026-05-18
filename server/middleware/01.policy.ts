import { clerkMiddleware } from "@clerk/nuxt/server";
import { BasePolicy } from "~~/mvc/policies/base";
import { OrderPolicy } from "~~/mvc/policies/order";
import { MenuPolicy } from "~~/mvc/policies/menu";
import { UserService } from "~~/mvc/service/user";

const log = createLogger("server.middleware.policy");

function checkPermission(policy: BasePolicy, method: string): void {
  const permissionMap: Record<string, () => boolean> = {
    GET: () => policy.canView(),
    POST: () => policy.canEdit(),
    PUT: () => policy.canEdit(),
    PATCH: () => policy.canEdit(),
    DELETE: () => policy.canDelete(),
  };

  const hasPermission = permissionMap[method]?.();
  if (hasPermission === false) {
    log.warn(
      { policy: policy.constructor.name, method },
      "[UNAUTHORIZED ACCESS]: Permissions check failed",
    );
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  log.success(
    { policy: policy.constructor.name, method },
    "[AUTHORIZED ACCESS]: Permissions check passed",
  );
}

export default clerkMiddleware(async (event) => {
  log.info(
    {
      path: event.path,
      params: { userId: event.context.auth().userId },
      method: event.method,
    },
    "Policy middleware invoked",
  );

  const { userId } = event.context.auth();
  if (!userId) return;

  // Skip policy check for user-specific endpoints (status/permissions)
  // These are used for initial auth and don't need policy enforcement
  if (event.path.startsWith("/api/user/")) return;

  const isApiItemPath =
    event.path.startsWith("/api/items") || event.path.startsWith("/api/item");
  const isApiOrderPath =
    event.path.startsWith("/api/orders") || event.path.startsWith("/api/order");

  // Only run policy checks for protected API routes
  if (!isApiItemPath && !isApiOrderPath) return;

  const userService = new UserService();
  const user = await userService.readUser(userId).catch((e) => {
    log.error(
      { err: e, path: event.path, params: { userId } },
      "[ERROR FETCHING USER]: Failed to fetch user from service",
    );
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to fetch user data",
    });
  });

  if (!user) {
    log.error(
      { path: event.path, params: { userId } },
      "[USER NOT FOUND]: No user found for policy enforcement",
    );
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }
  switch (true) {
    case isApiItemPath:
      const mp = new MenuPolicy(user);
      checkPermission(mp, event.method);
      break;
    case isApiOrderPath:
      const op = new OrderPolicy(user);
      checkPermission(op, event.method);
      break;
  }
});

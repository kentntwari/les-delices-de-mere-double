import { type H3Event } from "h3";

import { createRequestLogger } from "~~/server/utils/logger";
import { OrderController } from "~~/mvc/controllers/order";
import { JsonResponse } from "~~/mvc/controllers/base";
import type { IApiOrderCommentData } from "~~/shared/types";

const log = createRequestLogger("server.api.order.[orderId].comments.get.ts");

export default defineCachedEventHandler(
  async (event) => {
    try {
      const userId = event.context.auth().userId as string;

      const { orderId } = event.context.params as { orderId: string };

      log.info(
        event.path,
        event.method,
        {
          param: { orderId },
        },
        "GET REQUEST RECEIVED: Getting order comments",
      );

      const r = await new OrderController(toWebRequest(event))
        .promoteUserId(userId)
        .handleIntent("get-order-comments-details", orderId);

      if (!(r instanceof JsonResponse)) throw r;

      const comments = r.data.data;

      log.info(
        event.path,
        event.method,
        comments.map((c) => ({
          id: c.id,
          comment: c.comment,
          createdAt: c.createdAt,
        })),
        "GET REQUEST SUCCESS: Order comments retrieved successfully",
      );

      return comments.map(
        (c) =>
          ({
            id: c.id,
            comment: c.comment,
            _meta: {
              mentionedUsers: c.taggedUsers,
              likedCount: c.likedCount,
              createdBy: c.user_name || "UNKNOWN USER",
              createdAt: DateUtils.convertDate(new Date(c.createdAt)),
            },
          }) satisfies IApiOrderCommentData,
      );
    } catch (error) {
      treatErrors(error);
    }
  },
  {
    name: "comments",
    maxAge: 60 * 60 * 24, // 24 hours
    swr: true,
    getKey: (event: H3Event) => {
      const { orderId } = event.context.params as { orderId: string };
      if (!orderId) return "orderId_missing";
      return `orderId_${encodeURIComponent(orderId.toLowerCase())}`;
    },
  },
);

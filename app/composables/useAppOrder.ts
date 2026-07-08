import { FetchError } from "ofetch";
import type { TOrderLogDTO } from "~~/mvc/mapper/order";

export const useAppOrder = (
  orderId: Ref<string | undefined | null>,
  cursor: Ref<"items" | "comments" | "logs">,
) => {
  let controller = new AbortController();

  const logs = useAsyncState<TOrderLogDTO[] | null>(
    () =>
      $fetch<{ data: TOrderLogDTO[] }>(`/api/order/${orderId.value}/logs`, {
        retry: 3,
        retryDelay: 500,
        timeout: 1000 * 10,
        signal: controller.signal,
      }).then((res) => res?.data || null),
    null,
    {
      immediate: false,
      delay: 100,
      onError(error) {
        console.log("=============================");
        console.error(
          "Failed to fetch order logs:",
          error instanceof FetchError ? error.statusMessage : "",
        );
        console.log("==============================");
      },
    },
  );

  const comments = useAsyncState<IApiOrderCommentData[]>(
    () =>
      $fetch<{ data: IApiOrderCommentData[] }>(
        `/api/order/${orderId.value}/comments`,
        {
          retry: 3,
          retryDelay: 500,
          timeout: 1000 * 10,
          signal: controller.signal,
        },
      ).then((res) => res?.data || []),
    [],
    {
      immediate: false,
      delay: 100,
      onError(error) {
        console.log("=============================");
        console.error(
          "Failed to fetch order comments:",
          error instanceof FetchError ? error.statusMessage : "",
        );
        console.log("==============================");
      },
    },
  );

  whenever(cursor, (currentCursor) => {
    controller.abort();
    controller = new AbortController();

    switch (true) {
      case !orderId.value:
        console.error(
          "Order ID is not available, skipping fetch for logs and comments",
        );
        break;

      case currentCursor === "items":
        console.warn(
          "This tab is unhandled, skipping fetch for logs and comments",
        );
        break;

      default:
        logs.executeImmediate();
        break;
    }
  });

  return [null, logs, comments] as const;
};

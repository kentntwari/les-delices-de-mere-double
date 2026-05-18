import { FetchError } from "ofetch";
import type { TOrderLogDTO } from "~~/mvc/mapper/order";

export const useAppOrderLogs = (
  orderId: Ref<string | undefined | null>,
  tab: Ref<"items" | "comments" | "logs">,
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

  whenever(tab, (currentTab) => {
    controller.abort();
    controller = new AbortController();

    if (currentTab === "logs" && orderId.value) {
      logs.executeImmediate();
    }
  });

  return logs;
};

import { toValue } from "vue";
import type { OrderMetadataMap } from "~/app.cache";
import type { OrderTransformer } from "~~/mvc/transformers/order";
import type { TPreviewedOrderMetadata } from "~~/shared/types";

export function useAppOrderMetadata(
  orderId: ComputedRef<string>,
  defaultMetadata:
    | ComputedRef<TPreviewedOrderMetadata>
    | TPreviewedOrderMetadata
    | undefined,
  cacheMap: OrderMetadataMap,
) {
  const previewedMetadata = shallowRef<TPreviewedOrderMetadata>();

  function increaseLogsCount() {
    if (!previewedMetadata.value) return;
    if (!previewedMetadata.value.count) return;
    if (previewedMetadata.value.count.logs === "?") return;

    previewedMetadata.value = {
      ...previewedMetadata.value,
      count: {
        ...previewedMetadata.value.count,
        logs: (parseInt(previewedMetadata.value.count.logs) + 1).toString(),
      },
    };
  }

  function decreaseLogsCount() {
    if (!previewedMetadata.value) return;
    if (!previewedMetadata.value.count) return;
    if (previewedMetadata.value.count.logs === "?") return;

    previewedMetadata.value = {
      ...previewedMetadata.value,
      count: {
        ...previewedMetadata.value.count,
        logs: (parseInt(previewedMetadata.value.count.logs) - 1).toString(),
      },
    };
  }

  async function getMetadata() {
    const currentDefault = toValue(defaultMetadata);
    const placeholderDeliveryObj = {
      isRequested: currentDefault?.delivery?.isRequested ?? false,
      fee: currentDefault?.delivery?.fee || "?",
      address: currentDefault?.delivery?.address || null,
    } satisfies TPreviewedOrderMetadata["delivery"];

    try {
      const cached = cacheMap.get(`order-metadata__${orderId.value}`);

      const needsFetchCount = !cached?.count;
      const needsFetchDelivery = !cached?.delivery;

      const [countResult, deliveryResult] = await Promise.all([
        needsFetchCount
          ? $fetch<{
              data: ReturnType<typeof OrderTransformer.toCountMetadata>;
            }>("api/order/" + orderId.value + "/metadata/count", {
              method: "GET",
              onRequest() {
                if (previewedMetadata.value)
                  previewedMetadata.value = {
                    ...previewedMetadata.value,
                    count: {
                      comments: "?",
                      items: "?",
                      logs: "?",
                    },
                    delivery: placeholderDeliveryObj,
                  };
              },
            })
          : { data: cached.count },
        needsFetchDelivery
          ? $fetch<{
              data: ReturnType<typeof OrderTransformer.toDeliveryDetails>;
            }>("api/order/" + orderId.value + "/metadata/delivery", {
              method: "GET",
            })
          : { data: cached.delivery },
      ]);

      const resolveDeliveryFee = deliveryResult.data.fee
        ? typeof deliveryResult.data.fee === "number"
          ? deliveryResult.data.fee.toFixed(2)
          : deliveryResult.data.fee
        : "0.00";

      const b = deliveryResult.data.address;

      const resolveAddress = deliveryResult.data.address
        ? ({
            ...deliveryResult.data.address,
            province:
              "state" in deliveryResult.data.address
                ? deliveryResult.data.address.state
                : deliveryResult.data.address.province,
            country: "Canada",
          } satisfies TPreviewedOrderMetadata["delivery"]["address"])
        : null;

      // Update cache once with all resolved data
      cacheMap.set(`order-metadata__${orderId.value}`, {
        count: countResult.data ?? { comments: "?", items: "?", logs: "?" },
        delivery: {
          isRequested: deliveryResult.data.isRequested,
          fee: resolveDeliveryFee,
          address: resolveAddress,
        },
      });

      previewedMetadata.value = {
        ...previewedMetadata.value,
        count: {
          comments: countResult.data?.comments ?? "?",
          items: countResult.data?.items ?? "?",
          logs: countResult.data?.logs ?? "?",
        },
        delivery: {
          isRequested: deliveryResult.data.isRequested,
          fee: resolveDeliveryFee,
          address: resolveAddress,
        },
      };
    } catch (error) {
      previewedMetadata.value = {
        ...previewedMetadata.value,
        count: {
          comments: "?",
          items: currentDefault?.count?.items || "?",
          logs: "?",
        },
        delivery: placeholderDeliveryObj,
      };
    }
  }

  function clearCache() {
    if (cacheMap.has(`order-metadata__${orderId.value}`))
      cacheMap.delete(`order-metadata__${orderId.value}`);
  }

  return {
    previewedMetadata,
    getMetadata,
    increaseLogsCount,
    decreaseLogsCount,
    clearMetadataCache: clearCache,
  };
}

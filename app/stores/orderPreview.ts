import { defineStore } from "pinia";

import type { TOrderDTO } from "~~/mvc/mapper/order";
import type { THandleOrderIntentsSchema } from "~~/shared/utils/schemas.zod";
import type { TOrderRelatedCustomer } from "~~/shared/types";
import { orderMetadataMap, orderRelatedCustomerMap } from "~/app.cache";
import { useAppOrderMetadata } from "~/composables/useAppOrderMetadata";

export const useOrderPreviewStore = defineStore("orderPreview", () => {
  const currentPreviewedOrder = ref<TOrderDTO | null>(null);

  const p = useAppOrderMetadata(
    computed(() => currentPreviewedOrder.value?.id ?? ""),
    computed(() => ({
      count: {
        items: currentPreviewedOrder.value?.items.length.toString() ?? "?",
        logs: "?",
        comments: "?",
      },
      delivery: {
        isRequested:
          previewedItemsTotal.value.toFixed(2) ===
          parseFloat(currentPreviewedOrder.value?.total || "0.00").toFixed(2)
            ? false
            : true,
        fee: (
          previewedItemsTotal.value -
          parseFloat(currentPreviewedOrder.value?.total || "0.00")
        ).toFixed(2),
        address: null,
      },
    })),
    orderMetadataMap,
  );

  const statusUpdatedAt = ref(Date.now());
  const paymentStatusUpdatedAt = ref(Date.now());

  /* ---------------------------------------- items total---------------------------------------- */
  const previewedItemsTotal = computed(() => {
    if (!currentPreviewedOrder.value) return 0;
    return currentPreviewedOrder.value.items.reduce((total, item) => {
      return total + item.quantity * item.unitPrice;
    }, 0);
  });

  /*-------------------------------------------Status change-------------------------------------------*/
  function commitStatusChange(
    currentStatus: TOrderDTO["status"],
    newStatus: TOrderDTO["status"],
    intent: Extract<
      THandleOrderIntentsSchema,
      | "mark-as-not-started"
      | "mark-as-in-progress"
      | "mark-as-completed"
      | "mark-as-cancelled"
    >,
  ) {
    if (!currentPreviewedOrder.value?.id) return Promise.resolve();
    if (currentStatus === newStatus) return Promise.resolve();
    return $fetch<void>(`/api/order/${currentPreviewedOrder.value.id}`, {
      method: "PUT",
      body: { status: newStatus },
      query: { intent },
      onRequest() {
        currentPreviewedOrder.value!.status = newStatus;
        p.increaseLogsCount();
      },
      onRequestError() {
        currentPreviewedOrder.value!.status = currentStatus;
        p.decreaseLogsCount();
      },
      onResponseError() {
        currentPreviewedOrder.value!.status = currentStatus;
        p.decreaseLogsCount();
      },
      onResponse({ response }) {
        if (response.status === 204) {
          statusUpdatedAt.value = Date.now();
          p.clearMetadataCache();
        }
      },
    });
  }

  function changeStatus(status: TOrderDTO["status"]) {
    console.warn("Changing status to", status);
    if (!currentPreviewedOrder.value) return Promise.resolve();
    if (status === "NOT_STARTED")
      return commitStatusChange(
        currentPreviewedOrder.value.status,
        "NOT_STARTED",
        "mark-as-not-started",
      );
    else if (status === "IN_PROGRESS")
      return commitStatusChange(
        currentPreviewedOrder.value.status,
        "IN_PROGRESS",
        "mark-as-in-progress",
      );
    else if (status === "COMPLETED")
      return commitStatusChange(
        currentPreviewedOrder.value.status,
        "COMPLETED",
        "mark-as-completed",
      );
    else if (status === "CANCELLED")
      return commitStatusChange(
        currentPreviewedOrder.value.status,
        "CANCELLED",
        "mark-as-cancelled",
      );
    else return Promise.resolve(void 0);
  }

  /* ---------------------------------------- Payment status actions ---------------------------------------- */

  function commitPaymentStatusChange(
    currentStatus: TOrderDTO["paymentStatus"],
    newStatus: TOrderDTO["paymentStatus"],
    intent: Extract<
      THandleOrderIntentsSchema,
      "mark-as-paid" | "mark-as-unpaid"
    >,
  ) {
    if (!currentPreviewedOrder.value?.id) return Promise.resolve();

    if (currentStatus === newStatus) return Promise.resolve();

    return $fetch<void>(`/api/order/${currentPreviewedOrder.value.id}`, {
      method: "PUT",
      body: { paymentStatus: newStatus },
      query: { intent },
      onRequest() {
        currentPreviewedOrder.value!.paymentStatus = newStatus;
        p.increaseLogsCount();
      },
      onRequestError() {
        currentPreviewedOrder.value!.paymentStatus = currentStatus;
        p.decreaseLogsCount();
      },
      onResponseError() {
        currentPreviewedOrder.value!.paymentStatus = currentStatus;
        p.decreaseLogsCount();
      },
      onResponse({ response }) {
        if (response.status === 204) {
          paymentStatusUpdatedAt.value = Date.now();
          p.clearMetadataCache();
        }
      },
    });
  }

  function changePaymentStatus(status: TOrderDTO["paymentStatus"]) {
    console.warn("Changing payment status to", status);

    if (!currentPreviewedOrder.value) return Promise.resolve();

    if (status === "PAID")
      return commitPaymentStatusChange(
        currentPreviewedOrder.value.paymentStatus,
        "PAID",
        "mark-as-paid",
      );
    else if (status === "UNPAID")
      return commitPaymentStatusChange(
        currentPreviewedOrder.value.paymentStatus,
        "UNPAID",
        "mark-as-unpaid",
      );
    else return Promise.resolve(void 0);
  }

  /* ---------------------------------------- Fetch related customer ---------------------------------------- */

  let fetchCustomerAbortController: AbortController | null = null;

  async function fetchRelatedCustomer(): Promise<{
    data: TOrderRelatedCustomer | null;
    error: unknown | null;
  }> {
    const orderId = currentPreviewedOrder.value?.id;
    if (!orderId) return { data: null, error: null };

    fetchCustomerAbortController?.abort();
    fetchCustomerAbortController = new AbortController();

    try {
      const cached = orderRelatedCustomerMap.get(
        `order-related-customer__${orderId}`,
      );

      if (cached) {
        return { data: cached, error: null };
      }

      const t = await $fetch<{ data: TOrderRelatedCustomer }>(
        `/api/order/${orderId}/metadata/customer`,
        {
          signal: fetchCustomerAbortController.signal,
        },
      );

      orderRelatedCustomerMap.set(`order-related-customer__${orderId}`, t.data);

      return {
        data: { ...t.data },
        error: null,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { data: null, error: null };
      }
      console.warn("Failed to fetch related customer for order preview", error);
      return { data: null, error };
    }
  }

  /* ---------------------------------------- Expose ---------------------------------------- */

  return {
    currentPreviewedOrder,
    previewedMetadata: p.previewedMetadata,
    previewedItemsTotal,
    paymentStatusUpdatedAt,
    statusUpdatedAt,
    changeStatus,
    changePaymentStatus,
    fetchRelatedCustomer,
    getPreviewMetadata: p.getMetadata,
  };
});

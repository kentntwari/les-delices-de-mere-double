<script lang="ts" setup>
  import { toast } from "vue-sonner";
  import { nanoid } from "nanoid";

  import type { TProvidedInteractionState } from "~/types";
  import type { TOrderDTO } from "~~/mvc/mapper/order";
  import type { OrderTransformer } from "~~/mvc/transformers/order";

  import AppOrderCreatePanel from "~/components/app/order/CreatePanel.vue";
  import AppOrderPreviewEditPanel from "~/components/app/order/PreviewEdit.Panel.vue";

  import { GET_ORDERS_KEY, INJECT_FIRST_INTERACTION } from "~/app.keys";

  definePageMeta({
    name: "Orders",
  });

  const {
    status,
    data: orders,
    refresh,
  } = await useLazyFetch<{ data: TOrderDTO[] }>("/api/orders", {
    key: GET_ORDERS_KEY,
    default: () => ({ data: [] }),
    //TODO: Eventually leverage getCachedData
    //INFO: See commitOrderToServer function for an example of leveraging getCachedData for optimistic updates
  });

  const aggregatePageTotal = computed(() => {
    if (!orders.value) return "0.00";
    if (!orders.value.data) return "0.00";
    if (orders.value.data.length === 0) return "0.00";
    const total = orders.value.data.reduce(
      (acc, order) => acc + parseFloat(order.total),
      0,
    );
    return total.toFixed(2);
  });

  const emitted = shallowRef<{
    raw: TCreateOrderFormSchema;
    validated: TOrderSchema;
  }>();

  const panelKey = ref(nanoid());

  const commitOrderToServer = useDebounceFn(() => {
    if (!emitted.value) return;
    return $fetch("/api/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: emitted.value.raw,
      onRequestError() {
        emitted.value = undefined;
        rollbackOptimisticOrder();
      },
      onResponseError() {
        emitted.value = undefined;
        rollbackOptimisticOrder();
      },
      onResponse({ response }) {
        emitted.value = undefined;
        if (response.status === 204) panelKey.value = nanoid();
        /* TODO: Provide hook for background clearing of nuxtApp[payload] and nuxtApp[static] */
        refreshNuxtData(GET_ORDERS_KEY);
      },
    });
  }, 500);

  const commitOrderDeletionToServer = useDebounceFn(() => {
    if (!currentPreviewedOrder.value?.id) return;
    return $fetch(`/api/order/${currentPreviewedOrder.value.id}`, {
      method: "DELETE",
      onResponse({ response }) {
        if (response.status === 204) panelKey.value = nanoid();
        refreshNuxtData(GET_ORDERS_KEY);
      },
    });
  }, 500);

  const commitOrderPaymentStatusChangeToServer = useDebounceFn(
    (
      currentStatus: TOrderDTO["paymentStatus"],
      newStatus: TOrderDTO["paymentStatus"],
      intent: THandleOrderIntentsSchema,
    ) => {
      if (!currentPreviewedOrder.value?.id) return;

      return $fetch(`/api/order/${currentPreviewedOrder.value.id}`, {
        method: "PUT",
        body: { paymentStatus: newStatus },
        query: { intent },
        onRequest() {
          currentPreviewedOrder.value!.paymentStatus = newStatus;
          increaseLogsCount();
        },
        onRequestError() {
          currentPreviewedOrder.value!.paymentStatus = currentStatus;
          decreaseLogsCount();
        },

        onResponseError() {
          currentPreviewedOrder.value!.paymentStatus = currentStatus;
          decreaseLogsCount();
        },
        onResponse({ response }) {
          if (response.status === 204) refreshNuxtData(GET_ORDERS_KEY);
        },
      });
    },
    500,
  );

  const hasOrders = computed(() => {
    if (!orders.value) return false;
    if (!orders.value.data) return false;
    if (orders.value.data.length === 0) return false;
    return true;
  });

  const interactionState = inject<TProvidedInteractionState>(
    INJECT_FIRST_INTERACTION,
    {
      isFirstInteraction: computed(() => "false" as const),
    },
  );

  function addOptimisticOrder() {
    if (!emitted.value) return orders.value;
    if (orders.value.data) {
      orders.value = {
        data: [
          {
            ...emitted.value.validated,
            id: nanoid(7),
            paymentStatus: "UNPAID",
            status: "NOT_STARTED",
          },
          ...orders.value.data,
        ],
      };
    }
  }

  function deleteOptimisticOrder() {
    if (orders.value.data) {
      orders.value = {
        data: orders.value.data.filter(
          (order) => order.id !== currentPreviewedOrder.value?.id,
        ),
      };
    }
  }

  function rollbackOptimisticOrder() {
    if (!emitted.value) return orders.value;
    if (orders.value.data) {
      orders.value = {
        data: orders.value.data.filter(
          (order) => order.id !== emitted.value?.validated.id,
        ),
      };
    }
  }

  const appOrderCreatePanelBindings = {
    onCreated: async (r: TCreateOrderFormSchema, v: TOrderSchema) => {
      emitted.value = { raw: r, validated: v };
      addOptimisticOrder();
      await nextTick();
      toast.promise(commitOrderToServer(), {
        loading: "Creating order...",
        success: "Order created successfully!",
        error: "Failed to create order",
      });
    },
  } satisfies InstanceType<typeof AppOrderCreatePanel>["$props"];

  const currentPreviewedOrder = ref<Omit<TOrderDTO, "status"> | null>(null);

  const previewedMetadata =
    shallowRef<
      InstanceType<typeof AppOrderPreviewEditPanel>["$props"]["previewMetadata"]
    >(undefined);

  async function getPreviewMetadata() {
    try {
      const b = await $fetch<{
        data: ReturnType<typeof OrderTransformer.toCountMetadata>;
      }>("api/order/" + currentPreviewedOrder.value?.id + "/metadata/count", {
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
            };
        },
      });

      previewedMetadata.value = {
        ...previewedMetadata.value,
        count: {
          comments: b.data?.comments ?? "?",
          items: b.data?.items ?? "?",
          logs: b.data?.logs ?? "?",
        },
      };
    } catch (error) {
      console.log("Failed to fetch preview metadata");
      previewedMetadata.value = {
        ...previewedMetadata.value,
        count: {
          comments: "?",
          items: currentPreviewedOrder.value
            ? currentPreviewedOrder.value.items.length.toString()
            : "?",
          logs: "?",
        },
      };
    }
  }

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
</script>

<template>
  <section v-if="status === 'pending' && !hasOrders" class="container">
    <AppSkeletonDefault />
  </section>
  <section
    class="container h-full grid items-center justify-center gap-y-6"
    v-else-if="interactionState.isFirstInteraction.value && !hasOrders"
  >
    <div class="flex flex-col items-center gap-y-6">
      <p class="lg:text-2xl text-primary-400">{{ $t("data.no-orders") }}</p>
      <AppOrderCreatePanel v-bind="appOrderCreatePanelBindings" />
    </div>
  </section>

  <section class="h-full grid grid-rows-[auto_1fr]" v-else>
    <aside class="py-6 border-b border-neutral-grey-600">
      <div class="container w-full flex items-center justify-between">
        <header class="grid grid-cols-4">
          <h1 class="lowercase font-medium text-2xl text-primary-1100">
            {{
              $t("pages.orders.header-title", {
                "orders-count": orders.data.length,
              })
            }}
          </h1>
        </header>
        <footer>
          <AppOrderCreatePanel
            :key="panelKey"
            v-bind="appOrderCreatePanelBindings"
          />
        </footer>
      </div>
    </aside>
    <div class="mt-8 container grid grid-cols-1 items-center justify-center">
      <p class="text-center text-2xl text-primary-400" v-show="!hasOrders">
        {{ $t("pages.orders.no-orders") }}
      </p>
      <ul
        class="self-start grid-rows-subgrid items-start space-y-4"
        v-show="hasOrders"
      >
        <li
          class="min-h-14 bg-secondary-200 hover:bg-secondary-300/30 rounded-xl"
          v-for="order in orders.data"
          :key="order.id"
        >
          <AppOrderPreviewEditPanel
            :current-previewed-order="currentPreviewedOrder"
            :preview-metadata="previewedMetadata"
            @set-order="currentPreviewedOrder = order"
            @delete-order="
              async () => {
                deleteOptimisticOrder();
                await nextTick();
                toast.promise(commitOrderDeletionToServer(), {
                  loading: 'Deleting order...',
                  success: 'Order deleted successfully!',
                  error: 'Failed to delete order',
                });
              }
            "
            @fetch-metadata="getPreviewMetadata()"
            @refresh-orders="refreshNuxtData(GET_ORDERS_KEY)"
            @mark-as-paid="
              () => {
                return toast.promise(
                  commitOrderPaymentStatusChangeToServer(
                    order.paymentStatus,
                    'PAID',
                    'mark-as-paid',
                  ),
                  {
                    loading: 'Marking order as paid...',
                    success: 'Order marked as paid!',
                    error: 'Failed to mark order as paid',
                  },
                );
              }
            "
            @revert-payment-status="
              (status) => {
                return toast.promise(
                  commitOrderPaymentStatusChangeToServer(
                    order.paymentStatus,
                    status,
                    'revert-to-unpaid',
                  ),
                  {
                    loading: 'Reverting payment status...',
                    success: 'Payment status reverted!',
                    error: 'Failed to revert payment status',
                  },
                );
              }
            "
          >
            <span class="block space-x-4">
              <small
                class="inline-block min-w-[104px] text-base text-primary-1100"
                >#{{ order.id }}
              </small>
              <small
                v-for="(item, idx) in order.items.slice(0, 3)"
                :key="item.id"
              >
                <strong class="text-base font-semibold text-primary-1100">{{
                  item.title
                }}</strong>
                <em class="btn-pill bg-accent-one-400"
                  >Qty: {{ item.quantity }}
                </em>
                <i
                  class="ml-2 not-italic font-semibold text-lg text-primary-1100"
                  :class="[
                    order.items.length > 1 && idx !== order.items.length - 1
                      ? 'inline-block'
                      : 'hidden',
                  ]"
                  >+</i
                >
              </small>
              <strong v-show="order.items.length > 3">...</strong>
              <div
                class="inline-block space-x-2"
                :class="[order.items.length < 2 ? '-ml-1' : '']"
              >
                <em class="w-24 btn-pill bg-[#51bd28]/60">{{
                  order.status === "NOT_STARTED"
                    ? $t("order-status.not-started", "Not Started")
                    : order.status === "IN_PROGRESS"
                      ? $t("order-status.in-progress", "In Progress")
                      : order.status === "COMPLETED"
                        ? $t("order-status.completed", "Completed")
                        : order.status
                }}</em>
                <em class="m-0 w-18 btn-pill bg-neutral-grey-200 capitalize">{{
                  order.paymentStatus.toLocaleLowerCase()
                }}</em>
              </div>
            </span>
            <span class="block font-semibold text-center text-primary-1100"
              >${{ order.total }}</span
            >
          </AppOrderPreviewEditPanel>
        </li>

        <li
          id="orders-total"
          class="self-start mt-[33px] grid grid-cols-2 items-center"
        >
          <span
            class="block w-[120px] col-start-2 justify-self-end text-neutral-grey-1300"
            >Total: ${{ aggregatePageTotal }}</span
          >
        </li>
      </ul>
    </div>
  </section>
</template>

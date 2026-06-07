<script lang="ts" setup>
  import type { IApiOrderData } from "~~/shared/types";

  import {
    ChevronRightIcon,
    EllipsisIcon,
    PackageOpenIcon,
  } from "lucide-vue-next";

  import { GET_ORDER_FULL_DETAILS_KEY } from "~/app.keys";

  const store = useOrderPreviewStore();

  const orderId = useRoute().params.orderId as string;

  onMounted(() => {
    if (
      store.currentPreviewedOrder?.id?.toUpperCase() !== orderId.toUpperCase()
    )
      store.$patch({ currentPreviewedOrder: { id: orderId.toUpperCase() } });
  });

  const { getCachedData: g } = useRefreshApiDataUtils<{ data: IApiOrderData }>(
    `${GET_ORDER_FULL_DETAILS_KEY}__${orderId}`,
  );

  const {
    data: order,
    pending,
    error,
  } = await useLazyFetch<{ data: IApiOrderData }>(`/api/order/${orderId}`, {
    key: `${GET_ORDER_FULL_DETAILS_KEY}__${orderId}`,
    getCachedData: (key, nuxtApp, context) => {
      const cachedData = g(key, nuxtApp, context);
      return cachedData;
    },
  });
</script>

<template>
  <section class="h-full" v-if="pending">
    <AppSkeletonWithBoxOnTheSide class="container" />
  </section>
  <section class="h-full flex flex-col" v-else>
    <div class="min-h-20 py-6 border-b border-neutral-grey-400">
      <aside class="container space-y-6">
        <header
          class="w-full flex items-center justify-between"
          aria-label="essential order information header"
        >
          <div class="flex items-center gap-x-2">
            <h1 class="inline font-medium text-2xl text-primary-400">
              Current order
            </h1>
            <span class="inline-block text-primary-400"
              ><ChevronRightIcon class="w-6"
            /></span>
            <UISelect>
              <UISelectTrigger :size="'xs'" class="bg-accent-two-300 border-0">
                <UISelectValue
                  :placeholder="
                    orderId ?? order?.data?.id ?? 'Order ID not found'
                  "
                  class="before:content-['#'] text-accent-one-1300 uppercase first-of-type:[span]:gap-0"
                />
              </UISelectTrigger>
              <UISelectContent>
                <UISelectItem value="dee">dwedewdewd</UISelectItem>
                <UISelectItem value="wdwq">efefrefre</UISelectItem>
              </UISelectContent>
            </UISelect>
          </div>
          <div v-show="!!order?.data" class="space-x-2">
            <UIButton
              v-show="order?.data?.paymentStatus !== 'PAID'"
              :size="'md'"
              @click="
                () =>
                  order?.data?.paymentStatus !== 'PAID'
                    ? store.changePaymentStatus('PAID')
                    : void null
              "
              >Mark as paid</UIButton
            >
            <UIButton :size="'md'" variant="outline" class="w-[42px]"
              ><EllipsisIcon class="size-5"
            /></UIButton>
          </div>
        </header>
        <!-- FIX: Definetely needs improvement -->
        <AppOrderMetadataFooter
          :order="
            !order?.data
              ? null
              : {
                  ...order?.data,
                  timeline: {
                    createdAt: order.data._meta.createdAt,
                    updatedAt: order.data._meta.updatedAt,
                  },
                }
          "
        />
      </aside>
    </div>
    <div
      class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-y-4"
      v-show="error"
    >
      <span><PackageOpenIcon :size="64" stroke-width="1" /></span>
      <p class="font-regular text-base text-neutral-grey-900">
        This resource could not be found
      </p>
    </div>
    <div
      class="container flex-1 min-h-0 py-6 grid grid-cols-[1fr_36%]"
      v-show="!error"
    >
      <article class="grid grid-cols-2">
        <header
          aria-label="order items header"
          class="col-span-2 flex items-center justify-between"
        >
          <h2>{{ order }}</h2>
        </header>
      </article>
      <article>dwe</article>
    </div>
  </section>
</template>

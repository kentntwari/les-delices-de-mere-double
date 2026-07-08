<script lang="ts" setup>
  import type { IApiOrderData } from "~~/shared/types";

  import {
    ChevronRightIcon,
    EllipsisIcon,
    PackageOpenIcon,
    InfoIcon,
    PlusIcon,
    PencilIcon,
    FileXCornerIcon,
    TriangleAlertIcon,
    MessagesSquareIcon,
  } from "lucide-vue-next";

  import { GET_ORDER_FULL_DETAILS_KEY } from "~/app.keys";
  import { useOrderCommentsStore } from "~/stores/orderComments";

  const route = useRoute();
  const store = useOrderPreviewStore();
  const commentsStore = useOrderCommentsStore();

  const orderId = computed(() => route.params.orderId as string);

  const { getCachedData: g, refreshOrders } = useRefreshApiDataUtils<{
    data: IApiOrderData;
  }>(`${GET_ORDER_FULL_DETAILS_KEY}__${orderId.value}`);

  const cached = useNuxtData(`${GET_ORDER_FULL_DETAILS_KEY}__${orderId.value}`);

  const {
    data: order,
    pending,
    error,
  } = await useLazyFetch<{ data: IApiOrderData }>(
    () => `/api/order/${orderId.value}`,
    {
      key: computed(() => `${GET_ORDER_FULL_DETAILS_KEY}__${orderId.value}`),
      watch: [orderId],
      default: () => cached.data.value ?? undefined,
      getCachedData: (key, nuxtApp, context) => {
        const cachedData = g(key, nuxtApp, context);
        return cachedData;
      },
    },
  );

  // Keep route-driven order identity and server-seeded comments synchronized in one place.
  // This effect intentionally depends on the route param and fetched comment payload only.
  watchEffect(() => {
    // Patching the preview store may cause one extra stabilization pass, but it converges
    // immediately because the guard stops writing once the route and preview IDs match.
    if (
      store.currentPreviewedOrder?.id?.toUpperCase() !==
      orderId.value.toUpperCase()
    )
      store.$patch({
        currentPreviewedOrder: { id: orderId.value.toUpperCase() },
      });

    // The comments store merges fetched comments with streamed comments for the active order.
    commentsStore.syncWithOrder(
      orderId.value,
      order.value?.data._meta.comments || [],
    );
  });

  onBeforeUnmount(() => {
    commentsStore.clear();
  });

  const resolveItemsCount = computed(() => {
    if (order.value?.data._meta._itemsCount)
      return order.value.data._meta._itemsCount;
    if (order.value?.data.items) return order.value.data.items.length;
    return null;
  });

  const resolveCommentsCount = computed(() => {
    if (commentsStore.comments.length > 0) return commentsStore.comments.length;
    if (typeof order.value?.data._meta._commentsCount === "number")
      return order.value.data._meta._commentsCount;
    if (order.value?.data._meta.comments)
      return order.value.data._meta.comments.length;
    return null;
  });

  const resolveLogsCount = computed(() => {
    if (typeof order.value?.data._meta._logsCount === "number")
      return order.value.data._meta._logsCount;
    if (order.value?.data._meta.logs) return order.value.data._meta.logs.length;
    return null;
  });
</script>

<template>
  <section class="h-full" v-if="pending">
    <AppSkeletonWithBoxOnTheSide class="container" />
  </section>

  <section class="h-full grid grid-rows-[auto_1fr] mb-10" v-else>
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
      class="container row-start-2 col-start-1 h-full flex-1 min-h-0 *:py-6 grid grid-cols-[1fr_36%]"
      v-show="!error"
    >
      <article class="pr-7 grid grid-cols-2 grid-rows-[auto_1fr] gap-y-4">
        <header
          aria-label="order items header"
          class="col-span-2 flex items-center justify-between"
        >
          <h2 class="font-medium text-2xl text-primary-400">
            {{
              $t("pages.order.items.header-title", {
                count: resolveItemsCount ?? "??",
              })
            }}
          </h2>
          <UIButton variant="outline" :size="'sm'" class="h-[38px]">
            <PencilIcon class="size-5" />
          </UIButton>
        </header>
        <footer
          aria-label="order items footer"
          class="col-span-2"
          v-show="!!order?.data"
        >
          <ul class="space-y-2">
            <li
              v-for="item in order?.data?.items"
              :key="item.id"
              class="flex items-center *:first:block"
            >
              <AppOrderPreviewEditPill :type="'preview'" :current-item="item" />
            </li>
            <li v-show="resolveItemsCount! < 7">
              <button
                type="button"
                class="w-full lg:h-12 flex items-center justify-center gap-x-1 outline-2 outline-dashed outline-neutral-grey-700 hover:outline-neutral-grey-800 transition-colors duration-150 uppercase text-sm rounded-md cursor-pointer"
              >
                <span class="block">
                  <PlusIcon :size="16" />
                </span>
                <span class="block">
                  {{
                    $t(
                      "components.order.create-panel.items-list.button-add-items",
                    )
                  }}
                </span>
              </button>
            </li>

            <li
              v-show="resolveItemsCount === 7"
              class="w-full mt-2 font-regular text-sm text-orange-700 flex items-center gap-x-1"
            >
              <span class="inline-block"><TriangleAlertIcon :size="16" /></span>
              <span class="inline-block"
                >You can only add up to 7 items per order</span
              >
            </li>
            <li class="lg:h-[120px] flex items-center">
              <div
                class="w-full flex items-start justify-between font-semibold text-secondary-1300"
              >
                <span class="block text-base">Total</span>
                <span class="block max-w-80 text-right">
                  ${{ order?.data?.total || "0.00" }}
                </span>
              </div>
            </li>
          </ul>
        </footer>
      </article>
      <article
        class="relative z-20 bg-slate-200 border-l border-b border-neutral-grey-600 col-start-2 pl-7 py-6"
      >
        <UITabs :default-value="'comments'">
          <UITabsList>
            <UITabsTrigger :value="'comments'"
              >Comments ({{ resolveCommentsCount ?? "??" }})</UITabsTrigger
            >
            <UITabsTrigger :value="'logs'"
              >Logs ({{ resolveLogsCount ?? "??" }})</UITabsTrigger
            >
          </UITabsList>
          <UITabsContent :value="'comments'">
            <div
              class="grid h-full min-w-0 w-full grid-rows-[1fr_auto] overflow-hidden"
            >
              <div
                v-show="commentsStore.comments.length === 0"
                class="flex flex-col items-center justify-center gap-y-4"
              >
                <MessagesSquareIcon :size="48" stroke-width="1" />
                <p class="font-regular text-base text-neutral-grey-900">
                  No comments found
                </p>
              </div>
              <ul v-show="commentsStore.comments.length > 0" class="space-y-2">
                <li
                  v-for="message in commentsStore.comments"
                  :key="message.id"
                  class="min-w-0 max-w-full"
                >
                  <AppOrderChatWrapper :order-id="orderId">
                    <AppOrderChatMessage
                      :author="message._meta.createdBy"
                      :message="{
                        id: message.id,
                        comment: message.comment,
                        likedCount: message._meta.likedCount,
                        userName: message._meta.createdBy,
                        createdAt: message._meta.createdAt,
                      }"
                      @reply="commentsStore.replyFn.reply(message.id)"
                    />
                  </AppOrderChatWrapper>
                </li>
                <li
                  aria-label="maximum messages caution"
                  class="mt-7 flex items-center gap-2"
                >
                  <span><InfoIcon :size="20" /></span>
                  <span class="text-sm"
                    >To prevent abuse, note that only 10 comments per order are
                    allowed.</span
                  >
                </li>
              </ul>

              <ClientOnly>
                <AppOrderChatWrapper
                  :order-id="orderId"
                  v-slot="{ submit, errors }"
                  v-if="!commentsStore.repliedComments.length"
                >
                  <form @submit.prevent>
                    <AppOrderChatInput
                      @submit="
                        async () => {
                          await submit();
                          refreshOrders();
                        }
                      "
                    />
                    <small
                      class="block mt-0.5 text-red-700"
                      v-show="errors.comment"
                      >{{ errors.comment }}</small
                    >
                  </form>
                </AppOrderChatWrapper>
              </ClientOnly>
            </div>
          </UITabsContent>
          <UITabsContent
            :value="'logs'"
            :class="[
              !!resolveLogsCount
                ? ''
                : 'flex flex-col items-center justify-center gap-y-4 *:ml-40',
            ]"
          >
            <LazyAppOrderLogs
              v-show="!!resolveLogsCount"
              :logs="order!.data!._meta!.logs"
            />

            <FileXCornerIcon
              v-show="!resolveLogsCount"
              :size="48"
              stroke-width="1"
            />
            <p
              v-show="!resolveLogsCount"
              class="font-regular text-base text-neutral-grey-900"
            >
              No logs found
            </p>
          </UITabsContent>
        </UITabs>
      </article>
    </div>

    <div
      v-show="!error"
      class="h-full row-start-2 col-start-1 grid grid-cols-[1fr_20%]"
    >
      <div></div>
      <div
        class="h-full bg-linear-to-r from-slate-200 via-slate-100 to-transparent border-b border-neutral-grey-600"
      ></div>
    </div>
  </section>
</template>

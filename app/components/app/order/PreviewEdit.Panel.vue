<script lang="ts" setup>
  import type { TOrderDTO } from "~~/mvc/mapper/order";
  import { VisuallyHidden } from "reka-ui";
  import { EllipsisVerticalIcon, InfoIcon } from "lucide-vue-next";

  const props = defineProps<{
    currentPreviewedOrder: Omit<TOrderDTO, "status"> | null;
    previewMetadata?: {
      count: { items: string; comments: string; logs: string };
    };
  }>();

  const currentPreviewdOrderTotal = computed(() => {
    if (!props.currentPreviewedOrder) return "0.00";
    const itemsTotal = props.currentPreviewedOrder.items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0,
    );

    if (parseFloat(props.currentPreviewedOrder.total) === itemsTotal)
      return "$" + props.currentPreviewedOrder.total;

    const deliveryFee =
      parseFloat(props.currentPreviewedOrder.total) - itemsTotal;

    return `$${itemsTotal.toFixed(2)} + $${deliveryFee.toFixed(2)} (Delivery fee) = $${props.currentPreviewedOrder.total}`;
  });

  const emits = defineEmits<{
    (e: "set-order"): void;
    (e: "delete-order", id?: string): void;
    (e: "fetch-metadata"): void;
    (e: "refresh-orders"): void;
    (e: "mark-as-paid"): void;
    (e: "revert-payment-status", status: TOrderDTO["paymentStatus"]): void;
  }>();

  const orderActions = {
    isPreviewOpen: ref(false),
    isEditing: ref(false),
    previewedTab: ref<"items" | "comments" | "logs">("items"),
    openPreview: () => (orderActions.isPreviewOpen.value = true),
    openEditor: () => (orderActions.isEditing.value = true),
    closePreview: () => (orderActions.isPreviewOpen.value = false),
    closeEditor: () => (orderActions.isEditing.value = false),
    previewOrder: async () => {
      emits("set-order");
      await nextTick();
      emits("fetch-metadata");
      orderActions.openPreview();
    },
    markAsPaid: async () => {
      if (!props.currentPreviewedOrder) return;
      try {
        emits("mark-as-paid");
        await nextTick();
      } finally {
        if (orderActions.previewedTab.value === "logs") logs.execute(500);
      }
    },
  };

  const logs = useOrderLogs(
    computed(() => props.currentPreviewedOrder?.id),
    orderActions.previewedTab,
  );
</script>

<template>
  <UIDialog
    v-model:open="orderActions.isPreviewOpen.value"
    :key="'preview-dialog'"
  >
    <button
      :aria-label="`View order ${props.currentPreviewedOrder?.id}`"
      class="w-full h-full p-4 flex items-center justify-between cursor-pointer"
      @click="orderActions.previewOrder()"
    >
      <slot />
    </button>

    <UIDialogContent
      :key="'test'"
      v-if="orderActions.isEditing.value"
      :show-overlay="false"
      @interact-outside="(e) => e.preventDefault()"
      @escape-key-down="(e) => e.preventDefault()"
      class="right-8 top-6"
    >
      <UIDialogHeader>
        <UIDialogTitle
          >{{ $t("components.order.editor-panel.title") }}
          <span class="text-neutral-grey-900"
            >#{{ props.currentPreviewedOrder?.id }}</span
          >
        </UIDialogTitle>
      </UIDialogHeader>
      <section>hello there</section>
      <UIDialogFooter class="space-x-2">
        <UIButton :variant="'outline'" @click="orderActions.closeEditor()">{{
          $t("components.order.editor-panel.buttons.cancel")
        }}</UIButton>
        <UIButton :variant="'primary'">{{
          $t("components.order.editor-panel.buttons.save-changes")
        }}</UIButton>
      </UIDialogFooter>
    </UIDialogContent>

    <UIDialogContent
      :key="'fff'"
      @interact-outside="(e) => e.preventDefault()"
      @escape-key-down="(e) => e.preventDefault()"
      :class="[orderActions.isEditing.value ? 'opacity-50' : 'opacity-100']"
    >
      <UIDialogHeader>
        <UIDialogTitle
          >{{ $t("components.order.preview-panel.title") }}
          <span class="text-neutral-grey-900"
            >#{{ props.currentPreviewedOrder?.id }}</span
          >
        </UIDialogTitle>
        <div class="flex items-center gap-x-2">
          <UIPopover>
            <UIPopoverTrigger>
              <EllipsisVerticalIcon
                :size="32"
                :stroke-width="1"
                class="text-neutral-grey-700 hover:text-neutral-grey-900 cursor-pointer"
              />
            </UIPopoverTrigger>
            <UIPopoverContent
              :align="'end'"
              class="p-0 max-w-[164px] bg-transparent overflow-clip"
            >
              <ul
                class="p-0 *:px-6 *:py-2 *:h-10 *:bg-neutral-grey-200 *:hover:bg-neutral-grey-300 *:text-base *:text-neutral-grey-1300 *:cursor-pointer"
              >
                <li @click="orderActions.openEditor()">
                  <button>Edit</button>
                </li>
                <li>
                  <button>Expand</button>
                </li>
                <UIAlertDialog>
                  <UIAlertDialogTrigger as-child>
                    <li>
                      <button class="text-red-700 hover:text-red-900">
                        Delete
                      </button>
                    </li>
                  </UIAlertDialogTrigger>
                  <UIAlertDialogContent>
                    <UIAlertDialogTitle class="text-primary-1300">{{
                      $t("components.alerts.generic.title")
                    }}</UIAlertDialogTitle>
                    <UIAlertDialogDescription>{{
                      $t("components.alerts.order.delete-order.description")
                    }}</UIAlertDialogDescription>
                    <UIAlertDialogFooter class="mt-4 space-x-2">
                      <UIAlertDialogCancel as-child>
                        <UIButton :variant="'outline'">{{
                          $t("components.alerts.generic.cancel-button")
                        }}</UIButton>
                      </UIAlertDialogCancel>
                      <UIButton
                        :variant="'primary'"
                        @click="$emit('delete-order')"
                        >{{
                          $t("components.alerts.generic.confirm-button")
                        }}</UIButton
                      >
                    </UIAlertDialogFooter>
                  </UIAlertDialogContent>
                </UIAlertDialog>
              </ul>
            </UIPopoverContent>
          </UIPopover>

          <UIDialogClose />
        </div>
      </UIDialogHeader>

      <VisuallyHidden>
        <UIDialogDescription />
      </VisuallyHidden>

      <section class="p-6 space-y-6">
        <UITabs v-model="orderActions.previewedTab.value">
          <UITabsList>
            <UITabsTrigger :value="'items'"
              >Items ({{
                props.previewMetadata?.count.items || "?"
              }})</UITabsTrigger
            >
            <UITabsTrigger :value="'comments'"
              >Comments ({{
                props.previewMetadata?.count.comments || "?"
              }})</UITabsTrigger
            >
            <UITabsTrigger :value="'logs'"
              >Logs ({{
                props.previewMetadata?.count.logs || "?"
              }})</UITabsTrigger
            >
          </UITabsList>
          <UITabsContent :value="'items'">
            <AppOrderPreviewEditPill
              v-for="(item, idx) in props.currentPreviewedOrder?.items || []"
              :key="item.id"
              :index="idx"
              :type="'preview'"
              :current-item="item"
              class="lg:h-8 mb-2"
            />
            <div class="lg:h-[120px] flex items-center">
              <div
                class="w-full flex items-start justify-between font-semibold text-secondary-1300"
              >
                <span class="block text-base">Total</span>
                <span class="block max-w-[197px] text-right">
                  {{ currentPreviewdOrderTotal }}
                </span>
              </div>
            </div>
          </UITabsContent>
          <UITabsContent :value="'comments'"> </UITabsContent>
          <UITabsContent :value="'logs'">
            <AppSkeletonTwoLines v-if="logs.isLoading.value" />
            <LazyAppOrderLogs v-else :logs="logs.state.value" />
          </UITabsContent>
        </UITabs>
      </section>

      <p
        class="px-6 pb-6 inline-flex items-center gap-x-2"
        v-show="props.currentPreviewedOrder?.paymentStatus === 'PAID'"
      >
        <InfoIcon class="text-neutral-grey-1000" :size="22" />
        <span class="text-neutral-grey-1000">Order has been marked paid.</span
        ><button
          class="inline underline font-bold text-neutral-grey-1000 cursor-pointer"
          @click="$emit('revert-payment-status', 'UNPAID')"
        >
          Revert?
        </button>
      </p>

      <UIDialogFooter class="space-x-2">
        <UIButton :variant="'outline'">View customer info</UIButton>

        <UIButton
          :variant="'primary'"
          v-show="props.currentPreviewedOrder?.paymentStatus !== 'PAID'"
          :disabled="props.currentPreviewedOrder?.paymentStatus === 'PAID'"
          @click="
            props.currentPreviewedOrder?.paymentStatus !== 'PAID'
              ? orderActions.markAsPaid()
              : void null
          "
          >Mark as paid</UIButton
        >
      </UIDialogFooter>
    </UIDialogContent>
  </UIDialog>
</template>

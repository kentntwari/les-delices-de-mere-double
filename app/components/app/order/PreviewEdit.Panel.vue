<script lang="ts" setup>
  import type { TOrderDTO } from "~~/mvc/mapper/order";

  import { VisuallyHidden } from "reka-ui";
  import { nanoid } from "nanoid";
  import { storeToRefs } from "pinia";
  import {
    XIcon,
    EllipsisVerticalIcon,
    InfoIcon,
    PhoneIcon,
    MailIcon,
    Trash2Icon,
    TriangleAlertIcon,
    PlusIcon,
    MinusIcon,
  } from "lucide-vue-next";

  import { useOrderPreviewStore } from "~/stores/orderPreview";
  import { CustomerEntity } from "~~/mvc/entities/customer";
  import {
    updateOrderFormSchema,
    type TUpdateOrderFormSchema,
  } from "~~/shared/utils/schemas.zod";
  import { GET_MENU_ITEMS_KEY } from "~/app.keys";

  const { data: menuItems } = useNuxtData<{ data: TMenuSchema }>(
    GET_MENU_ITEMS_KEY,
  );

  const store = useOrderPreviewStore();

  const {
    currentPreviewedOrder,
    previewedMetadata,
    previewedItemsTotal,
    paymentStatusUpdatedAt,
    statusUpdatedAt,
  } = storeToRefs(store);

  const emits = defineEmits<{
    (e: "set-order"): void;
    (e: "delete-order", id: string): void;
    (e: "update-order", payload: TUpdateOrderFormSchema): void;
    (e: "update-status", status: TOrderDTO["status"]): void;
    (e: "mark-as-paid"): void;
    (e: "revert-payment-status", status: TOrderDTO["paymentStatus"]): void;
  }>();

  const orderActions = {
    isPreviewOpen: ref(false),
    isEditing: ref(false),
    isCancelling: ref(false),
    isViewingCustomer: ref(false),
    openPreview: () => (orderActions.isPreviewOpen.value = true),
    openEditor: () => (orderActions.isEditing.value = true),
    openCustomerInfo: () => (orderActions.isViewingCustomer.value = true),
    startCancelling: () => (orderActions.isCancelling.value = true),
    closePreview: () => (orderActions.isPreviewOpen.value = false),
    closeEditor: () => (orderActions.isEditing.value = false),
    stopCancelling: () => (orderActions.isCancelling.value = false),
    closeCustomerInfo: () => (orderActions.isViewingCustomer.value = false),
    setDefaults: () => {
      setValues({
        ...values,
        id: currentPreviewedOrder.value?.id,
        items: {
          ...values.items,
          current: currentPreviewedOrder.value?.items,
        },
        delivery: {
          isRequired: previewedMetadata.value?.delivery.isRequested,
          address:
            previewedMetadata.value?.delivery.isRequested &&
            previewedMetadata.value.delivery.address
              ? previewedMetadata.value.delivery.address
              : null,
        },
      });
    },
    startEditing: () => {
      setValues({ ...values, id: currentPreviewedOrder.value?.id });
      orderActions.openEditor();
    },
    cancelEditing: () => {
      orderActions.stopCancelling();
      orderActions.closeEditor();
      resetEditForm();
    },
    previewOrder: async () => {
      emits("set-order");
      await nextTick();
      previewedTab.value = "items";
      await nextTick();
      store.getPreviewMetadata();
      orderActions.openPreview();
    },
    updateOrder: (payload: TUpdateOrderFormSchema) => {
      emits("update-order", payload);
      orderActions.closeEditor();
    },
    updateStatus: (status: TOrderDTO["status"]) => {
      emits("update-status", status);
    },
    markAsPaid: async () => {
      emits("mark-as-paid");
    },
    revertPaymentStatus: (status: TOrderDTO["paymentStatus"]) => {
      emits("revert-payment-status", status);
      alertPreviewKey.value = nanoid();
    },
  };

  const previewedTab = ref<"items" | "comments" | "logs">("items");

  const alertPreviewKey = ref(nanoid());
  const popoverEditorKey = ref(nanoid());

  const logs = useAppOrderLogs(
    computed(() => currentPreviewedOrder.value?.id),
    previewedTab,
  );

  const customer = useAsyncState(store.fetchRelatedCustomer, null, {
    immediate: false,
  });

  watch(
    [paymentStatusUpdatedAt, statusUpdatedAt],
    ([paymentVal, statusVal]) => {
      if ((paymentVal || statusVal) && orderActions.isPreviewOpen.value)
        logs.execute(500);
    },
  );

  /* =============================================================== */
  /* ============================ EDIT ORDER FORM ======================= */
  /* =============================================================== */
  const {
    values,
    meta,
    setValues,
    resetForm: resetEditForm,
    handleSubmit,
  } = useForm({
    name: "edit-order-form_" + nanoid(),
    validationSchema: toTypedSchema(updateOrderFormSchema),
    initialValues: {
      items: {
        current: [],
        removed: [],
        added: [],
      },
    },
  });

  const totalItemsCount = computed(() => {
    const originalCount = currentPreviewedOrder.value?.items.length || 0;
    if (!values.items) return originalCount;

    const removedCount = values.items?.removed?.length || 0;
    const addedCount = values.items?.added?.length || 0;

    return originalCount - removedCount + addedCount;
  });

  const isRemoved = computed(() => {
    if (!values.items) return (id: string) => false;

    return (id: string) => values.items?.removed?.includes(id);
  });

  const shouldDisableSaveEditsBtn = computed(() => {
    if (meta.value.valid === false) return true;

    if (!values.items) return true;

    if (values.items.added!.length === 0 && values.items.removed!.length === 0)
      return true;

    if (
      values.items.added!.length === 0 &&
      values.items.removed!.length > 0 &&
      values.items.current!.length === 0
    )
      return true;
  });

  const onSubmit = handleSubmit(async (v) => {
    orderActions.updateOrder(v);
    await nextTick();
    resetEditForm();
  });
</script>

<template>
  <UIDialog
    v-model:open="orderActions.isPreviewOpen.value"
    :key="'preview-dialog'"
  >
    <button
      :aria-label="`View order ${currentPreviewedOrder?.id || ''}`"
      class="w-full h-full p-4 flex items-center justify-between cursor-pointer"
      @click="
        () => {
          orderActions.previewOrder();
          orderActions.setDefaults();
        }
      "
    >
      <slot />
    </button>

    <!-- -------------------------------------------------------- -->
    <!-- ------------------ EDITOR PANEL ----------------------- -->
    <!-- -------------------------------------------------------- -->

    <UIDialogContent
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
            >#{{ currentPreviewedOrder?.id }}</span
          >
        </UIDialogTitle>
        <div class="flex items-center gap-x-2">
          <UIButton
            :variant="'outline'"
            @click="orderActions.startCancelling()"
            class="size-7 rounded-[6px] border hover:border-2 border-neutral-grey-700 hover:border-neutral-grey-900 cursor-pointer"
          >
            <XIcon :stroke-width="1" />
          </UIButton>
        </div>
      </UIDialogHeader>
      <section class="p-6 grid grid-rows-[1fr_auto] gap-y-6">
        <header>
          <div class="flex items-center justify-between">
            <p aria-roledescription="total-ticker-count">
              {{
                $t("components.order.editor-panel.ticker.total-items", {
                  count: totalItemsCount,
                })
              }}
            </p>
            <p class="space-x-6">
              <span class="inline-block text-red-500">{{
                $t("components.order.editor-panel.ticker.removed-items", {
                  count: values.items?.removed?.length || 0,
                })
              }}</span>
              <span class="inline-block text-green-500">{{
                $t("components.order.editor-panel.ticker.added-items", {
                  count: values.items?.added?.length || 0,
                })
              }}</span>
            </p>
          </div>
          <ul class="mt-6 space-y-2">
            <li
              v-for="(item, index) in currentPreviewedOrder?.items"
              :key="item.id"
              class="flex items-center"
              :class="[
                isRemoved(item.id) &&
                  '*:first:block relative opacity-50 before:absolute before:w-full before:h-px before:bg-neutral-grey-900 pointer-events-none',
              ]"
            >
              <AppOrderPreviewEditPill :type="'preview'" :current-item="item" />

              <button
                class="cursor-pointer"
                @click="
                  values.items &&
                  setValues({
                    ...values,
                    items: {
                      ...values.items,
                      current: values.items.current?.filter(
                        (_, i) => i !== index,
                      ),
                      removed: [...values.items.removed!, item.id],
                    },
                  })
                "
                values.items.removed
                &&
                v-if="!isRemoved(item.id)"
              >
                <Trash2Icon
                  :size="24"
                  class="text-red-900 hover:text-red-700 transition-colors"
                />
              </button>
            </li>
            <li
              v-for="(addedItem, index) in values.items?.added || []"
              :key="addedItem.id"
            >
              <AppOrderPreviewEditPill
                :type="'edit'"
                :current-item="addedItem"
                :menu-items="menuItems?.data.items || []"
                class="*:first:bg-accent-one-500 *:data-[slot=select-trigger]:bg-neutral-grey-100 rounded-sm"
                @update-quantity="
                  (q) =>
                    setValues({
                      ...values,
                      items: {
                        ...values.items,
                        added: values.items?.added?.map((item, i) =>
                          i === index ? { ...item, quantity: q } : item,
                        ),
                      },
                    })
                "
                @select-item="
                  (item: TMenuSchema['items'][number]) =>
                    setValues({
                      ...values,
                      items: {
                        ...values.items,
                        added: values.items?.added?.map((added, i) =>
                          i === index
                            ? {
                                ...added,
                                id: item.id,
                                title: item.title,
                                unitPrice: item.unitPrice,
                              }
                            : added,
                        ),
                      },
                    })
                "
              >
                <template #delete>
                  <button
                    class="cursor-pointer"
                    @click="
                      setValues({
                        ...values,
                        items: {
                          ...values.items,
                          added: values.items?.added?.filter(
                            (_, i) => i !== index,
                          ),
                        },
                      })
                    "
                  >
                    <MinusIcon
                      :size="24"
                      class="text-red-900 hover:text-red-700 transition-colors"
                    />
                  </button>
                </template>
              </AppOrderPreviewEditPill>
            </li>
            <li v-if="totalItemsCount < 7">
              <button
                type="button"
                class="w-full lg:h-12 flex items-center justify-center gap-x-1 outline-2 outline-dashed outline-neutral-grey-700 hover:outline-neutral-grey-800 transition-colors duration-150 uppercase text-sm rounded-md cursor-pointer"
                @click="
                  setValues({
                    ...values,
                    items: {
                      ...values.items,
                      added: [
                        ...(values.items?.added || []),
                        {
                          id: nanoid(),
                          title: '',
                          quantity: 1,
                          unitPrice: 0,
                        },
                      ],
                    },
                  })
                "
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
              v-show="totalItemsCount === 7"
              class="w-full mt-2 font-regular text-sm text-orange-700 flex items-center gap-x-1"
            >
              <span class="inline-block"><TriangleAlertIcon :size="16" /></span>
              <span class="inline-block"
                >You can only add up to 7 items per order</span
              >
            </li>
          </ul>
        </header>
        <footer>
          <div>
            <p
              class="w-full mt-2 font-regular text-sm text-neutral-grey-900 flex items-center gap-x-1"
            >
              <span class="inline-block"><InfoIcon :size="16" /></span>
              <span class="inline-block">{{
                $t("components.order.editor-panel.info.notice-2")
              }}</span>
            </p>
            <p
              class="w-full mt-2 font-regular text-sm text-neutral-grey-900 flex items-center gap-x-1"
            >
              <span class="inline-block"><InfoIcon :size="16" /></span>
              <span class="inline-block">{{
                $t("components.order.editor-panel.info.notice-1")
              }}</span>
            </p>
          </div>
        </footer>
      </section>
      <UIDialogFooter class="space-x-2">
        <UIAlertDialog v-model:open="orderActions.isCancelling.value">
          <UIAlertDialogTrigger as-child>
            <UIButton :variant="'outline'">{{
              $t("components.order.editor-panel.buttons.cancel")
            }}</UIButton>
          </UIAlertDialogTrigger>
          <UIAlertDialogContent>
            <UIAlertDialogTitle class="text-primary-1300">{{
              $t("components.alerts.generic.title")
            }}</UIAlertDialogTitle>
            <UIAlertDialogDescription>{{
              $t("components.alerts.order.cancel-editing.description")
            }}</UIAlertDialogDescription>
            <UIAlertDialogFooter class="mt-4 space-x-2">
              <UIAlertDialogCancel as-child>
                <UIButton :variant="'outline'">{{
                  $t("components.alerts.generic.cancel-button")
                }}</UIButton>
              </UIAlertDialogCancel>
              <UIButton
                :variant="'primary'"
                @click="orderActions.cancelEditing()"
                >{{ $t("components.alerts.generic.confirm-button") }}
              </UIButton>
            </UIAlertDialogFooter>
          </UIAlertDialogContent>
        </UIAlertDialog>

        <UIButton
          :variant="'primary'"
          :disabled="shouldDisableSaveEditsBtn"
          @click="onSubmit"
          >{{
            $t("components.order.editor-panel.buttons.save-changes")
          }}</UIButton
        >
      </UIDialogFooter>
    </UIDialogContent>

    <!-- -------------------------------------------------------- -->
    <!-- ------------------ PREVIEW PANEL ----------------------- -->
    <!-- -------------------------------------------------------- -->

    <UIDialogContent
      @interact-outside="(e) => e.preventDefault()"
      @escape-key-down="(e) => e.preventDefault()"
      :class="[orderActions.isEditing.value ? 'opacity-50' : 'opacity-100']"
    >
      <UIDialogHeader>
        <UIDialogTitle
          >{{ $t("components.order.preview-panel.title") }}
          <div class="inline-flex items-center gap-x-4">
            <span class="text-neutral-grey-900"
              >#{{ currentPreviewedOrder?.id }}</span
            >

            <LazyAppOrderPreviewEditSwitchStatus
              v-if="currentPreviewedOrder"
              :current-status="currentPreviewedOrder?.status"
              @update="(status) => orderActions.updateStatus(status)"
            />
          </div>
        </UIDialogTitle>
        <div class="flex items-center gap-x-2">
          <UIPopover :key="popoverEditorKey">
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
                <li
                  v-show="
                    currentPreviewedOrder?.paymentStatus !== 'PAID' ||
                    currentPreviewedOrder?.status !== 'COMPLETED'
                  "
                  @click="
                    () => {
                      if (
                        currentPreviewedOrder?.paymentStatus === 'PAID' ||
                        currentPreviewedOrder?.status === 'COMPLETED'
                      )
                        return void null;

                      orderActions.startEditing();
                      popoverEditorKey = nanoid();
                    }
                  "
                >
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
                        @click="
                          emits('delete-order', currentPreviewedOrder?.id || '')
                        "
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
        <UITabs v-model="previewedTab" :key="currentPreviewedOrder?.id">
          <UITabsList>
            <UITabsTrigger :value="'items'"
              >Items ({{
                previewedMetadata?.count?.items || "?"
              }})</UITabsTrigger
            >
            <UITabsTrigger :value="'comments'"
              >Comments ({{
                previewedMetadata?.count?.comments || "?"
              }})</UITabsTrigger
            >
            <UITabsTrigger :value="'logs'"
              >Logs ({{ previewedMetadata?.count?.logs || "?" }})</UITabsTrigger
            >
          </UITabsList>
          <UITabsContent :value="'items'">
            <AppOrderPreviewEditPill
              v-for="(item, idx) in currentPreviewedOrder?.items || []"
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
                <span class="block max-w-80 text-right">
                  ${{ previewedItemsTotal }} + ${{
                    previewedMetadata?.delivery.fee || "0.00"
                  }}
                  (delivery fee)=<br />${{
                    currentPreviewedOrder?.total || "0.00"
                  }}
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
        v-show="currentPreviewedOrder?.paymentStatus === 'PAID'"
      >
        <InfoIcon class="text-neutral-grey-1000" :size="22" />
        <span class="text-neutral-grey-1000">Order has been marked paid.</span>

        <UIAlertDialog :key="alertPreviewKey">
          <UIAlertDialogTrigger as-child>
            <button
              class="inline underline font-bold text-neutral-grey-1000 cursor-pointer"
            >
              Revert?
            </button>
          </UIAlertDialogTrigger>
          <UIAlertDialogContent>
            <UIAlertDialogTitle class="text-primary-1300">{{
              $t("components.alerts.generic.title")
            }}</UIAlertDialogTitle>
            <UIAlertDialogDescription>{{
              $t("components.alerts.order.revert-payment-status.description")
            }}</UIAlertDialogDescription>
            <UIAlertDialogFooter class="mt-4 space-x-2">
              <UIAlertDialogCancel as-child>
                <UIButton :variant="'outline'">{{
                  $t("components.alerts.generic.cancel-button")
                }}</UIButton>
              </UIAlertDialogCancel>
              <UIButton
                :variant="'primary'"
                @click="orderActions.revertPaymentStatus('UNPAID')"
                >{{ $t("components.alerts.generic.confirm-button") }}</UIButton
              >
            </UIAlertDialogFooter>
          </UIAlertDialogContent>
        </UIAlertDialog>
      </p>

      <UIDialogFooter class="space-x-2">
        <UIPopover v-model:open="orderActions.isViewingCustomer.value">
          <UIPopoverAnchor>
            <UIButton
              :variant="'outline'"
              @click="
                () => {
                  customer.executeImmediate();
                  orderActions.openCustomerInfo();
                }
              "
              >View customer info</UIButton
            >
          </UIPopoverAnchor>

          <UIPopoverContent
            :align="'end'"
            :side-offset="10"
            class="min-h-[120px] min-w-[316px]"
          >
            <AppSkeletonTwoLines v-if="customer.isLoading.value" />
            <div
              v-else-if="!customer.state.value?.data"
              class="mt-2 flex flex-col items-center justify-center gap-2 text-neutral-grey-1000"
            >
              <TriangleAlertIcon class="text-red-700" :size="22" />
              <p class="text-sm">Unable to load customer information</p>
            </div>
            <template v-else>
              <span class="font-medium text-lg text-primary-1300">{{
                customer.state.value?.data?.fullName
              }}</span>

              <a
                :href="
                  'tel:' +
                  CustomerEntity.parsePhone(
                    customer.state.value?.data?.phone || '',
                  )
                "
                class="mt-4 flex items-center text-neutral-grey-1000 hover:text-primary-500"
              >
                <PhoneIcon class="mr-2" :size="18" />

                {{
                  customer.state.value?.data?.phone
                    ? CustomerEntity.parsePhone(
                        customer.state.value?.data?.phone,
                      )
                    : "-"
                }}
              </a>

              <a
                :href="'mailto:' + (customer.state.value?.data?.email || '')"
                class="mt-3 flex items-center text-neutral-grey-1000 hover:text-primary-500"
              >
                <MailIcon class="mr-2" :size="18" />
                {{ customer.state.value?.data?.email || "-" }}
              </a>
            </template>
          </UIPopoverContent>
        </UIPopover>

        <UIButton
          :variant="'primary'"
          v-show="currentPreviewedOrder?.paymentStatus !== 'PAID'"
          :disabled="currentPreviewedOrder?.paymentStatus === 'PAID'"
          @click="
            currentPreviewedOrder?.paymentStatus !== 'PAID'
              ? orderActions.markAsPaid()
              : void null
          "
          >Mark as paid</UIButton
        >
      </UIDialogFooter>
    </UIDialogContent>
  </UIDialog>
</template>

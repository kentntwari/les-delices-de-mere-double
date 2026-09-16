<script lang="ts" setup>
  const props = defineProps<{
    orderedItems: NonNullable<TCreateOrderFormSchema["items"]>;
    cxInfo: {
      fullName: string;
      phoneNumber: string;
      whatsappNumber: string;
      email: string;
    };
    deliveryInfo: {
      isRequested: boolean;
      fee: number | null;
      address: Partial<TCreateOrderFormSchema["delivery"]["address"]>;
    };
  }>();

  const emits = defineEmits<{
    (e: "modify-items"): void;
    (e: "update:delivery", value: boolean): void;
    (e: "modify-address"): void;
    (e: "modify-customer"): void;
  }>();

  const itemsPreview = computed(() => {
    return {
      count: props.orderedItems.length,
      total:
        props.orderedItems
          .reduce((acc, item) => acc + item.unitPrice * item.quantity, 0)
          .toFixed(2) || "0.00",
    } as const;
  });

  const totalCost = computed(() => {
    if (!props.deliveryInfo.isRequested) return itemsPreview.value.total;
    const deliveryFee = props.deliveryInfo.fee || 0;
    return (parseFloat(itemsPreview.value.total) + deliveryFee).toFixed(2);
  });

  const isDeliveryRequested = ref(
    props.deliveryInfo.isRequested ? "yes" : "no",
  );

  const shouldNotShowAddress = computed(() => {
    if (!props.deliveryInfo.address) return true;
    if (!props.deliveryInfo.address.street && !props.deliveryInfo.address.city)
      return true;
    return false;
  });
</script>
<template>
  <article
    class="grid grid-cols-2 *:block *:col-span-1 *:odd:self-center *:even:justify-self-end *:even:text-right *:odd:font-medium *:odd:text-neutral-grey-1000 gap-y-4"
  >
    <span id="items-count">
      {{
        $t("components.order.create-panel.preview.items-count", {
          count: itemsPreview.count,
        })
      }}
      (total: ${{ itemsPreview.total }})
    </span>
    <UIButton variant="outline" class="w-fit h-8" @click="emits('modify-items')"
      >{{ $t("components.order.create-panel.preview.button.modify") }}
    </UIButton>
    <span>{{
      $t("components.order.create-panel.preview.labels.delivery-requested")
    }}</span>
    <div id="request-delivery">
      <UISelect v-model="isDeliveryRequested">
        <UISelectTrigger
          class="data-[size=default]:h-11 px-3.5 bg-white border-neutral-grey-500"
        >
          <UISelectValue
            :aria-label="
              isDeliveryRequested === 'yes'
                ? $t('components.order.create-panel.preview.button.is-delivery')
                : $t(
                    'components.order.create-panel.preview.button.is-no-delivery',
                  )
            "
            class="capitalize font-medium text-neutral-grey-1000"
          >
          </UISelectValue>
        </UISelectTrigger>
        <UISelectContent>
          <UISelectItem
            class="text-base capitalize"
            value="yes"
            @select="emits('update:delivery', true)"
          >
            {{ $t("components.order.create-panel.preview.button.is-delivery") }}
          </UISelectItem>
          <UISelectItem value="no" @select="emits('update:delivery', false)">
            {{
              $t("components.order.create-panel.preview.button.is-no-delivery")
            }}
          </UISelectItem>
        </UISelectContent>
      </UISelect>
    </div>
    <template v-if="props.deliveryInfo.isRequested">
      <span>{{
        $t("components.order.create-panel.preview.labels.delivery-fee")
      }}</span>
      <div class="flex">
        <Field name="delivery.minimumFee" :keep-value="true" v-slot="{ field }">
          <UIFloatNumeric
            v-bind="field"
            id="delivery-minimum-fee"
            label=""
            :default-value="field.value || '10'"
            class="max-w-[84px] h-11 text-center"
          />
        </Field>
        <ErrorMessage
          name="delivery.minimumFee"
          class="block text-right text-xs text-red-600 mt-1"
        />
      </div>
      <span style="align-self: start">{{
        $t("components.order.create-panel.preview.labels.delivery-address")
      }}</span>
      <div id="address-info">
        <address
          class="not-italic *:text-base *:text-neutral-grey-1300 *:text-right"
          v-show="!shouldNotShowAddress"
        >
          <small>{{ props.deliveryInfo.address?.street }}</small
          ><br />
          <small
            >{{ props.deliveryInfo.address?.city }},
            {{ props.deliveryInfo.address?.postalCode }}</small
          ><br />
          <small>{{ props.deliveryInfo.address?.country }}</small>
        </address>
        <span class="block" v-show="shouldNotShowAddress">{{
          $t("components.order.create-panel.preview.errors.no-address")
        }}</span>
        <UIButton
          variant="outline"
          class="mt-4 w-fit h-8"
          @click="emits('modify-address')"
          >{{ $t("components.order.create-panel.preview.button.modify") }}
        </UIButton>
      </div>
    </template>
    <span style="align-self: start">{{
      $t("components.order.create-panel.preview.labels.customer-info")
    }}</span>
    <div id="customer-info">
      <address
        class="not-italic *:text-base *:text-neutral-grey-1300 *:text-right"
      >
        <small>{{ props.cxInfo.fullName }}</small
        ><br />
        <small>{{ props.cxInfo.phoneNumber }}</small
        >, <small>{{ props.cxInfo.whatsappNumber }}</small
        ><br />
        <small>{{ props.cxInfo.email }}</small>
      </address>
      <UIButton
        variant="outline"
        class="mt-4 w-fit h-8"
        @click="emits('modify-customer')"
        >{{ $t("components.order.create-panel.preview.button.modify") }}
      </UIButton>
    </div>
    <span style="align-self: start"
      >{{ $t("components.order.create-panel.preview.labels.total-cost") }}

      <br />
      <small class="text-base block" v-show="props.deliveryInfo.isRequested"
        >(incl.delivery)</small
      >

      (excl. taxes)
    </span>
    <span id="total-cost" class="self-center text-neutral-grey-1300">
      ${{ totalCost }}
    </span>
  </article>
</template>

<script lang="ts" setup>
  import { InfoIcon } from "lucide-vue-next";

  const props = defineProps<{
    data: Partial<TCreateOrderFormSchema["delivery"]> | undefined | null;
  }>();

  const emits = defineEmits<{
    (e: "update:delivery", value: boolean): void;
    (e: "update:home-address", value: boolean): void;
  }>();

  const deliveryChoices = {
    "does-request": "customer requests delivery",
    "no-delivery": "customer does not request delivery",
  } as const;

  const choice = ref<keyof typeof deliveryChoices>(
    props.data?.isRequired ? "does-request" : "no-delivery",
  );

  const provinces = computed(() => {
    return {
      BC: "British Columbia",
      MB: "Manitoba",
      NB: "New Brunswick",
      NL: "Newfoundland and Labrador",
      NS: "Nova Scotia",
      ON: "Ontario",
      PE: "Prince Edward Island",
      QC: "Quebec",
      SK: "Saskatchewan",
      NT: "Northwest Territories",
      NU: "Nunavut",
      YT: "Yukon",
    } as const;
  });
</script>

<template>
  <div class="h-full grid grid-rows-[auto_auto_1fr] gap-y-8">
    <UISelect v-model="choice">
      <UISelectTrigger
        class="data-[size=default]:h-11 bg-white border-neutral-grey-500 text-neutral-grey-1000"
      >
        <UISelectValue :aria-label="choice">{{
          deliveryChoices[choice]
        }}</UISelectValue>
      </UISelectTrigger>
      <UISelectContent>
        <UISelectItem
          v-for="(label, key) in deliveryChoices"
          :key="key"
          :value="key"
          @select="emits('update:delivery', key === 'does-request')"
        >
          {{ label }}
        </UISelectItem>
      </UISelectContent>
    </UISelect>
    <address
      class="grid grid-cols-2 gap-y-6 gap-x-2 not-italic"
      v-if="props.data?.isRequired"
    >
      <div class="col-span-full" aria-label="street">
        <Field
          name="delivery.address.street"
          :keep-value="true"
          v-slot="{ field, meta }"
        >
          <UIFormInput
            v-bind="field"
            label="Street"
            title="Address street"
            placeholder="e.g: 3950 Henri-Bourassa O."
            class="h-11"
          />
          <ErrorMessage
            name="delivery.address.street"
            class="mt-1 text-xs text-red-600"
            v-show="meta.touched"
          />
        </Field>
      </div>
      <div class="col-span-1">
        <Field
          name="delivery.address.city"
          :keep-value="true"
          v-slot="{ field, meta }"
        >
          <UIFormInput
            v-bind="field"
            label="City"
            title="Address city"
            placeholder="e.g: Montreal"
            class="h-11"
          />
          <ErrorMessage
            name="delivery.address.city"
            class="mt-1 text-xs text-red-600"
            v-show="meta.touched"
          />
        </Field>
      </div>
      <div class="col-span-1">
        <span class="block mb-[5px] text-sm text-neutral-grey-1100"
          >Province</span
        >
        <Field
          name="delivery.address.province"
          :keep-value="true"
          v-slot="{ field, meta }"
        >
          <UISelect v-bind="field" class="w-full">
            <UISelectTrigger
              class="data-[size=default]:h-11 bg-white border-neutral-grey-500 text-neutral-grey-1000 w-full"
            >
              <UISelectValue
                :aria-label="field.value"
                :placeholder="'Select province...'"
              >
                {{
                  provinces[
                    (props.data.address?.province as keyof typeof provinces) ||
                      "QC"
                  ] || field.value
                }}
              </UISelectValue>
            </UISelectTrigger>
            <UISelectContent>
              <UISelectItem
                v-for="(label, key) in provinces"
                :key="key"
                :value="key"
              >
                {{ label }}
              </UISelectItem>
            </UISelectContent>
          </UISelect>
          <ErrorMessage
            name="delivery.address.province"
            class="mt-1 text-xs text-red-600"
            v-show="meta.touched"
          />
        </Field>
      </div>
      <div class="col-span-1">
        <Field
          name="delivery.address.postalCode"
          :keep-value="true"
          v-slot="{ field, meta }"
        >
          <UIFormInput
            v-bind="field"
            label="Postal Code"
            title="Address postal code"
            placeholder="e.g: H4R 2K5"
            class="h-11"
          />
          <ErrorMessage
            name="delivery.address.postalCode"
            class="mt-1 text-xs text-red-600"
            v-show="meta.touched"
          />
        </Field>
      </div>
      <div class="col-span-1">
        <UIFormInput
          disabled
          label="Country"
          title="Address country"
          placeholder="e.g: Canada"
          value="Canada"
          class="pointer-events-none disabled:bg-neutral-grey-300 disabled:text-neutral-grey-900 h-11"
        />
      </div>
    </address>

    <div
      class="h-full flex flex-col justify-between"
      v-if="props.data?.isRequired"
    >
      <div class="*:text-sm *:text-neutral-grey-1000 space-y-2">
        <small class="flex items-center gap-x-2">
          <InfoIcon class="size-5" />
          {{
            $t(
              "components.order.create-panel.delivery-instructions.caution.valid-address",
            )
          }}
        </small>
        <small class="flex items-center gap-x-2">
          <InfoIcon class="size-5" />
          {{
            $t(
              "components.order.create-panel.delivery-instructions.caution.fee-disclaimer",
            )
          }}
        </small>
      </div>
      <div class="col-span-full flex items-center gap-x-2">
        <UICheckbox
          :default-value="props.data?.address?.isHomeAddress ?? true"
          :label="
            $t(
              'components.order.create-panel.delivery-instructions.form.is-home-address',
            )
          "
          @update:model-value="
            emits(
              'update:home-address',
              typeof $event === 'boolean' ? $event : true,
            )
          "
        />
        <span class="block font-medium text-sm text-neutral-grey-1100">{{
          $t(
            "components.order.create-panel.delivery-instructions.form.is-home-address",
          )
        }}</span>
      </div>
    </div>
  </div>
</template>

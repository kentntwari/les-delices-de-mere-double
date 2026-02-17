<script lang="ts" setup>
  import type { CheckboxRootEmits } from "reka-ui";
  import { GET_CUSTOMERS_KEY } from "~/app.keys";
  import { CircleQuestionMarkIcon } from "lucide-vue-next";

  const props = defineProps<{
    hasCustomers: boolean;
    data: Partial<TCreateOrderFormSchema["cx"]> | undefined | null;
  }>();

  const emits = defineEmits<{
    (
      e: "set-customer",
      type: "existing" | "new" | "none",
      value: Omit<TCreateOrderFormSchema["cx"], "isSameAsWhatsapp"> | null,
    ): void;
    (e: "set-whatsapp", value: CheckboxRootEmits["update:modelValue"][0]): void;
  }>();

  const { data: customers } = useNuxtData<{ data: TCustomerSchema[] }>(
    GET_CUSTOMERS_KEY,
  );
</script>

<template>
  <div class="h-full flex items-center justify-center">
    <div v-if="!data" class="space-y-3">
      <UISelect>
        <UISelectTrigger
          class="bg-white border-neutral-grey-500"
          v-show="hasCustomers"
          >{{
            $t("components.order.create-panel.customer-details.select-btn")
          }}</UISelectTrigger
        >
        <UISelectContent>
          <UISelectItem
            v-for="customer in customers?.data"
            :key="customer.id"
            :value="customer.id"
            @select="
              () =>
                emits('set-customer', 'existing', {
                  ...customer,
                })
            "
          >
            {{ customer.fullName }}
          </UISelectItem>
        </UISelectContent>
      </UISelect>
      <span
        class="block w-full text-center font-medium text-sm text-neutral-grey-1300"
        v-show="hasCustomers"
      >
        or</span
      >
      <span class="block" v-show="!hasCustomers"
        >You currently have no customers.</span
      >
      <UIButton
        variant="link"
        class="w-full text-center text-sm"
        @click="emits('set-customer', 'new', null)"
      >
        {{
          hasCustomers
            ? $t("components.order.create-panel.customer-details.create-btn")
            : $t(
                "components.order.create-panel.customer-details.create-btn-without-priors",
              )
        }}
      </UIButton>
    </div>
    <div class="w-full h-full flex flex-col justify-between" v-else>
      <fieldset name="customer-details" class="*:w-full space-y-6">
        <div>
          <Field
            :name="'cx.fullName'"
            :keep-value="true"
            v-slot="{ field, handleChange }"
          >
            <UIFormInput
              v-bind="field"
              :label="
                $t(
                  'components.order.create-panel.customer-details.form.full-name',
                )
              "
              :title="
                $t(
                  'components.order.create-panel.customer-details.form.full-name',
                )
              "
              placeholder="e.g: Evrard Giswaswa"
              class="lg:h-12"
            />
          </Field>
          <ErrorMessage name="cx.fullName" class="text-xs text-red-600 mt-1" />
        </div>
        <div class="grid grid-cols-[auto_1fr] space-x-2">
          <div
            class="col-span-full mb-[5px] font-medium text-sm text-neutral-grey-1100"
          >
            <span>{{
              $t(
                "components.order.create-panel.customer-details.form.phone-number",
              )
            }}</span>
            <button title="Customer phone number information" type="button">
              <CircleQuestionMarkIcon
                :size="14"
                class="inline-block ml-2 cursor-pointer"
                aria-label="Customer phone number information"
              />
            </button>
          </div>
          <div class="flex items-center gap-x-2">
            <small>+</small>
            <Field
              :name="'cx.phone.countryCode'"
              :keep-value="true"
              v-slot="{ field: f, validate }"
            >
              <UIFloatNumeric
                v-bind="f"
                id="countryCode"
                :default-value="props.data?.phone?.countryCode"
                :label="''"
                :title="
                  $t(
                    'components.order.create-panel.customer-details.form.phone-number',
                  )
                "
                maxlength="3"
                placeholder="1"
                @blur="validate()"
                class="mb-0 max-w-16 lg:h-12"
              />
            </Field>
          </div>

          <Field
            :name="'cx.phone.number'"
            :keep-value="true"
            v-slot="{ field, validate }"
          >
            <UIFloatNumeric
              v-bind="field"
              id="cx-phone-number"
              :default-value="props.data?.phone?.number"
              :label="''"
              :title="
                $t(
                  'components.order.create-panel.customer-details.form.phone-number',
                )
              "
              @blur="validate()"
              placeholder="e.g: 5551234567"
              class="mb-0 col-span-full lg:h-12"
            />
          </Field>
          <ErrorMessage
            name="cx.phone.countryCode"
            class="text-xs text-red-600 mt-1 col-span-full"
          />
          <ErrorMessage
            name="cx.phone.number"
            class="text-xs text-red-600 mt-1 col-span-full"
          />
          <div class="mt-4 col-span-full flex items-center gap-x-2">
            <UICheckbox
              :default-value="props.data?.isSameAsWhatsapp ?? true"
              :label="
                $t(
                  'components.order.create-panel.customer-details.form.is-same-as-whatsapp',
                )
              "
              @update:model-value="emits('set-whatsapp', $event)"
            />
            <span class="block font-medium text-sm text-neutral-grey-1100">{{
              $t(
                "components.order.create-panel.customer-details.form.is-same-as-whatsapp",
              )
            }}</span>
          </div>
        </div>
        <div
          class="grid grid-cols-[auto_1fr] space-x-2"
          v-if="!props.data?.isSameAsWhatsapp"
        >
          <div
            class="col-span-full mb-[5px] font-medium text-sm text-neutral-grey-1100"
          >
            <span>{{
              $t(
                "components.order.create-panel.customer-details.form.whatsapp-number",
              )
            }}</span>
            <button title="Customer whatsapp number information" type="button">
              <CircleQuestionMarkIcon
                :size="14"
                class="inline-block ml-2 cursor-pointer"
                aria-label="Customer whatsapp number information"
              />
            </button>
          </div>

          <div class="flex items-center gap-x-2">
            <small>+</small>
            <Field
              :name="'cx.whatsappNumber.countryCode'"
              :keep-value="true"
              v-slot="{ field, validate }"
            >
              <UIFloatNumeric
                v-bind="field"
                id="cx-whatsapp-country-code"
                :default-value="props.data?.whatsappNumber?.countryCode"
                :label="''"
                :title="
                  $t(
                    'components.order.create-panel.customer-details.form.whatsapp-number',
                  )
                "
                maxlength="3"
                placeholder="1"
                @blur="validate()"
                class="mb-0 max-w-16 lg:h-12"
              />
            </Field>
          </div>

          <Field
            :name="'cx.whatsappNumber.number'"
            :keep-value="true"
            v-slot="{ field }"
          >
            <UIFloatNumeric
              v-bind="field"
              id="cx-whatsapp-number"
              :default-value="props.data?.whatsappNumber?.number"
              :label="''"
              :title="
                $t(
                  'components.order.create-panel.customer-details.form.whatsapp-number',
                )
              "
              placeholder="e.g: 5551234567"
              maxlength="8"
              class="mb-0 col-span-full lg:h-12"
            />
          </Field>
          <ErrorMessage
            name="cx.whatsappNumber.countryCode"
            class="text-xs text-red-600 mt-1 col-span-full"
          />
          <ErrorMessage
            name="cx.whatsappNumber.number"
            class="text-xs text-red-600 mt-1 col-span-full"
          />
        </div>

        <div>
          <Field :name="'cx.email'" :keep-value="true" v-slot="{ field }">
            <UIFormInput
              v-bind="field"
              :label="
                $t(
                  'components.order.create-panel.customer-details.form.email-address',
                )
              "
              :title="
                $t(
                  'components.order.create-panel.customer-details.form.email-address',
                )
              "
              placeholder="e.g: evrard.giswaswa@example.com"
              class="lg:h-12"
            />
          </Field>
          <ErrorMessage name="cx.email" class="text-xs text-red-600 mt-1" />
        </div>
      </fieldset>
      <UIButton
        variant="link"
        class="justify-start m-0 p-0 lg:text-sm"
        @click="emits('set-customer', 'none', null)"
        v-show="hasCustomers"
      >
        {{
          $t(
            "components.order.create-panel.customer-details.form.choose-existing-customer",
          )
        }}
      </UIButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { nanoid } from "nanoid";
  import type { HTMLAttributes } from "vue";

  import { toast } from "vue-sonner";

  const props = defineProps<{
    defaults?: TAddressSchema;
    class?: HTMLAttributes["class"];
  }>();

  const emits = defineEmits<{
    (e: "submit", value: TAddressSchema): void;
    (e: "cancel"): void;
  }>();

  const { provinces, normalizeProvince } = useAppProvinces();

  const { meta, errors, values, defineField } = useForm({
    name: "edit-delivery-address_" + nanoid(),
    validationSchema: toTypedSchema(addressSchema),
    initialValues: {
      street: props.defaults?.street || "",
      city: props.defaults?.city || "",
      province: normalizeProvince(props.defaults?.province),
      postalCode: props.defaults?.postalCode || "",
      country: "Canada",
    },
  });

  const [street, streetAttrs] = defineField("street");
  const [city, cityAttrs] = defineField("city");
  const [province, provinceAttrs] = defineField("province");
  const [postalCode, postalCodeAttrs] = defineField("postalCode");
  const [country, countryAttrs] = defineField("country");

  function handleSaveChanges() {
    const result = addressSchema.safeParse({
      street: values.street,
      city: values.city,
      province: values.province,
      postalCode: values.postalCode,
      country: values.country,
    });

    if (!result.success) {
      toast.error("One or more fields are not valid");
      return;
    }

    emits("submit", result.data);
  }
</script>

<template>
  <address
    :class="cn('grid grid-cols-2 gap-y-6 gap-x-2 not-italic', props.class)"
  >
    <div class="col-span-full" aria-label="street">
      <UIFormInput
        v-model="street"
        v-bind="streetAttrs"
        label="Street"
        name="street"
        title="Address street"
        placeholder="e.g: 3950 Henri-Bourassa O."
        class="h-11"
      />
      <ErrorMessage
        name="street"
        class="mt-1 text-xs text-red-600"
        v-show="errors.street"
      />
    </div>
    <div class="col-span-1">
      <UIFormInput
        v-model="city"
        v-bind="cityAttrs"
        label="City"
        name="city"
        title="Address city"
        placeholder="e.g: Montreal"
        class="h-11"
      />
      <ErrorMessage
        name="city"
        class="mt-1 text-xs text-red-600"
        v-show="errors.city"
      />
    </div>
    <div class="col-span-1">
      <span class="block mb-[5px] text-sm text-neutral-grey-1100"
        >Province</span
      >

      <UISelect v-model="province" v-bind="provinceAttrs" class="w-full">
        <UISelectTrigger
          class="data-[size=default]:h-11 bg-white border-neutral-grey-500 text-neutral-grey-1000 w-full"
        >
          <UISelectValue
            :aria-label="province"
            :placeholder="'Select province...'"
            name="province"
          >
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
        name="province"
        class="mt-1 text-xs text-red-600"
        v-show="errors.province"
      />
    </div>
    <div class="col-span-1">
      <UIFormInput
        v-model="postalCode"
        v-bind="postalCodeAttrs"
        label="Postal Code"
        title="Address postal code"
        placeholder="e.g: H4R 2K5"
        class="h-11"
        name="postalCode"
      />
      <ErrorMessage
        name="postalCode"
        class="mt-1 text-xs text-red-600"
        v-show="errors.postalCode"
      />
    </div>
    <div class="col-span-1">
      <UIFormInput
        v-model="country"
        v-bind="countryAttrs"
        disabled
        label="Country"
        title="Address country"
        placeholder="e.g: Canada"
        value="Canada"
        class="pointer-events-none disabled:bg-neutral-grey-300 disabled:text-neutral-grey-900 h-11"
        name="country"
      />
    </div>
    <div class="col-span-full grid space-y-2">
      <UIButton
        :variant="'primary'"
        :size="'md'"
        class="col-span-full"
        :disabled="!meta.valid"
        @click="handleSaveChanges"
      >
        Save changes
      </UIButton>
      <UIButton
        :variant="'outline'"
        :size="'md'"
        class="col-span-full"
        @click="emits('cancel')"
      >
        Cancel
      </UIButton>
    </div>
  </address>
</template>

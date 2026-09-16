<script lang="ts" setup>
  const deliveryChoices = {
    "does-request": "Customer requests delivery",
    "no-delivery": "Customer does not request delivery",
  } as const;

  const props = defineProps<{
    default?: keyof typeof deliveryChoices;
  }>();

  const emits = defineEmits<{
    (e: "update:delivery", value: boolean): void;
  }>();

  const choice = ref<keyof typeof deliveryChoices>(
    props.default || "no-delivery",
  );
</script>

<template>
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
</template>

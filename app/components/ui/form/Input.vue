<script lang="ts" setup>
  import type { HTMLAttributes, InputHTMLAttributes } from "vue";

  interface FormInputProps extends /* @vue-ignore */ InputHTMLAttributes {
    label: string;
    title: string;
    placeholder: string;
    class?: HTMLAttributes["class"];
  }

  const props = defineProps<FormInputProps>();
  const model = defineModel<string>();

  defineOptions({
    inheritAttrs: false,
  });

  const handleInput = (event: Event) => {
    model.value = (event.target as HTMLInputElement).value;
  };
</script>

<template>
  <label>
    <span
      class="block mb-[5px] text-sm text-neutral-grey-1100"
      :title="title"
      >{{ label }}</span
    >
    <input
      v-bind="{ ...$attrs }"
      :value="model ?? $attrs.value"
      :placeholder="placeholder"
      :class="
        cn(
          'bg-white w-full h-10 text-sm text-neutral-grey-1300 outline outline-neutral-grey-500 focus:neutral-grey-900 focus:ring-2 focus:ring-neutral-grey-900 rounded-lg pl-3 pr-2 placeholder:text-sm placeholder:font-regular',
          props.class,
        )
      "
      @input="handleInput"
    />
  </label>
</template>

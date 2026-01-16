<script lang="ts" setup>
  import type { HTMLAttributes, InputHTMLAttributes } from "vue";
  interface FormInputProps extends /* @vue-ignore */ InputHTMLAttributes {
    label: string;
    title: string;
    placeholder: string;
    class?: HTMLAttributes["class"];
  }
  const props = defineProps<FormInputProps>();

  defineOptions({
    inheritAttrs: false,
  });
</script>

<template>
  <label>
    <span class="block mb-1 text-neutral-grey-1100" :title="title">{{
      label
    }}</span>
    <input
      v-bind="{ ...$attrs }"
      :placeholder="placeholder"
      :class="
        cn(
          'mt-[5px] bg-white w-full h-10 text-neutral-grey-1300 outline outline-neutral-grey-500 focus:neutral-grey-900 focus:ring-2 focus:ring-neutral-grey-900 rounded-lg pl-3 pr-2',
          props.class
        )
      "
    />
  </label>
</template>

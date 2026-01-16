<script setup lang="ts">
  import type { PrimitiveProps } from "reka-ui";
  import type { ButtonHTMLAttributes } from "vue";
  import type { ButtonVariants } from ".";
  import { Primitive } from "reka-ui";
  import { cn } from "~/utils/cn";
  import { buttonVariants } from ".";

  interface Props
    extends PrimitiveProps ,/*@vue-ignore * */
      ButtonHTMLAttributes {
    variant?: ButtonVariants["variant"];
    size?: ButtonVariants["size"];
    class?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    as: "button",
  });
</script>

<template>
  <Primitive
    data-slot="button"
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>

<script setup lang="ts">
  import type { HTMLAttributes } from "vue";
  import { cn } from "@/utils/cn";

  const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>

<template>
  <div
    data-slot="dialog-footer"
    :class="
      cn(
        'bg-background w-full px-6 h-24 flex items-center justify-end border-t border-neutral-grey-600 rounded-b-3xl',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
  import type { HTMLAttributes } from "vue";
  import { cn } from "@/utils/cn";

  const props = defineProps<{
    class?: HTMLAttributes["class"];
  }>();
</script>

<template>
  <div
    data-slot="dialog-header"
    :class="
      cn(
        'bg-background w-full px-6 h-18.5 flex items-center justify-between border-b border-neutral-grey-600 rounded-t-3xl  text-left',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>

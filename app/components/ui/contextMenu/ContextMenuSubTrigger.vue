<script setup lang="ts">
  import type { ContextMenuSubTriggerProps } from "reka-ui";
  import type { HTMLAttributes } from "vue";
  import { reactiveOmit } from "@vueuse/core";
  import { ChevronRight } from "lucide-vue-next";
  import { ContextMenuSubTrigger, useForwardProps } from "reka-ui";
  import { cn } from "@/utils/cn";

  const props = defineProps<
    ContextMenuSubTriggerProps & {
      class?: HTMLAttributes["class"];
      inset?: boolean;
    }
  >();

  const delegatedProps = reactiveOmit(props, "class");

  const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <ContextMenuSubTrigger
    data-slot="context-menu-sub-trigger"
    :data-inset="inset ? '' : undefined"
    v-bind="forwardedProps"
    :class="
      cn(
        'focus:bg-neutral-grey-400 focus:text-neutral-grey-900 data-[state=open]:bg-neutral-grey-500 text-neutral-grey-1300 data-[state=open]:text-neutral-grey-1100 flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
        props.class
      )
    "
  >
    <slot />
    <ChevronRight class="ml-auto" />
  </ContextMenuSubTrigger>
</template>

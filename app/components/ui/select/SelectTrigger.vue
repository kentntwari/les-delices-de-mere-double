<script setup lang="ts">
  import type { SelectTriggerProps } from "reka-ui";
  import type { HTMLAttributes } from "vue";
  import { reactiveOmit } from "@vueuse/core";
  import { ChevronDown } from "lucide-vue-next";
  import { SelectIcon, SelectTrigger, useForwardProps } from "reka-ui";
  import { cn } from "~/utils/cn";

  const props = withDefaults(
    defineProps<
      SelectTriggerProps & {
        class?: HTMLAttributes["class"];
        size?: "sm" | "default";
      }
    >(),
    { size: "default" }
  );

  const delegatedProps = reactiveOmit(props, "class", "size");
  const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <SelectTrigger
    data-slot="select-trigger"
    :data-size="size"
    v-bind="forwardedProps"
    :class="
      cn(
        'border-input focus-visible:border-neutral-grey-500 focus-visible:ring-neutral-grey-500/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
        props.class
      )
    "
  >
    <slot name="default" />
    <slot name="icon">
      <SelectIcon as-child>
        <ChevronDown class="size-4" />
      </SelectIcon>
    </slot>
  </SelectTrigger>
</template>

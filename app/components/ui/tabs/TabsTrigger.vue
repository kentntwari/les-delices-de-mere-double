<script setup lang="ts">
  import type { TabsTriggerProps } from "reka-ui";
  import type { HTMLAttributes } from "vue";
  import { reactiveOmit } from "@vueuse/core";
  import { TabsTrigger, useForwardProps } from "reka-ui";
  import { cn } from "@/utils/cn";

  const props = defineProps<
    TabsTriggerProps & { class?: HTMLAttributes["class"] }
  >();

  const delegatedProps = reactiveOmit(props, "class");

  const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <TabsTrigger
    data-slot="tabs-trigger"
    :class="
      cn(
        'data-[state=active]:bg-white focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring inline-flex h-[calc(100%-1px)] min-h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 text-sm data-[state=active]:font-semibold font-medium uppercase data-[state=active]:text-neutral-grey-1300 text-neutral-grey-1000 whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
        props.class,
      )
    "
    v-bind="forwardedProps"
  >
    <slot />
  </TabsTrigger>
</template>

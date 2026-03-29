<script setup lang="ts">
  import type { DialogContentEmits, DialogContentProps } from "reka-ui";
  import type { HTMLAttributes } from "vue";
  import { reactiveOmit } from "@vueuse/core";
  import { X } from "lucide-vue-next";
  import {
    DialogClose,
    DialogContent,
    DialogPortal,
    useForwardPropsEmits,
  } from "reka-ui";
  import { cn } from "@/utils/cn";
  import DialogOverlay from "./DialogOverlay.vue";

  defineOptions({
    inheritAttrs: false,
  });

  const props = withDefaults(
    defineProps<
      DialogContentProps & {
        class?: HTMLAttributes["class"];
        showCloseButton?: boolean;
        showOverlay?: boolean;
      }
    >(),
    {
      showCloseButton: true,
      showOverlay: true,
    },
  );
  const emits = defineEmits<DialogContentEmits>();

  const delegatedProps = reactiveOmit(props, "class");

  const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <DialogPortal>
    <DialogOverlay v-show="showOverlay" />
    <DialogContent
      data-slot="dialog-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="
        cn(
          'bg-neutral-grey-200 grid grid-rows-[auto_1fr_auto] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open] :zoom-in-95 fixed top-4 right-4 z-50 lg:min-h-[calc(100vh-2rem)] w-full lg:max-w-180 rounded-3xl border shadow-lg duration-200 sm:max-w-lg',
          props.class,
        )
      "
    >
      <slot />
    </DialogContent>
  </DialogPortal>
</template>

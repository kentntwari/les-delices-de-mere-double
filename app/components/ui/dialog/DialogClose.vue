<script setup lang="ts">
  import type { DialogCloseProps } from "reka-ui";

  import { DialogClose } from "reka-ui";
  import { X } from "lucide-vue-next";

  const props = defineProps<DialogCloseProps>();
</script>

<template>
  <DialogClose
    data-slot="dialog-close"
    v-bind="props"
    class="size-7 rounded-[6px] border border-neutral-grey-700 cursor-pointer"
  >
    <X :size="24" :stroke-width="1" class="text-neutral-grey-700" />
  </DialogClose>
</template>

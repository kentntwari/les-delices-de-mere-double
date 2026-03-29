<script lang="ts" setup>
  import type { TOrderLogDTO } from "~~/mvc/mapper/order";

  import { FileTextIcon } from "lucide-vue-next";

  const props = defineProps<{
    logs: TOrderLogDTO[] | null;
  }>();
</script>

<template>
  <ul class="grid grid-rows-[1fr_auto] *:not-last:mb-4">
    <li
      v-for="log in logs"
      :key="log.createdAt"
      class="w-full flex items-center gap-1 *:text-primary-500"
    >
      <FileTextIcon :size="20" class="text-gray-500" />
      <p class="text-sm">{{ log.message }}</p>
    </li>
  </ul>
</template>

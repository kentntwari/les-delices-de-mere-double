<script lang="ts" setup>
  import type { TOrderCommentDTO } from "~~/mvc/mapper/order";
  import { MessageCirclePlusIcon, ThumbsUpIcon } from "lucide-vue-next";

  const props = defineProps<{
    author: string;
    message: TOrderCommentDTO;
  }>();

  const emits = defineEmits<{
    (e: "reply"): void;
    (e: "like"): void;
  }>();

  function highlightMentions(text: string): string {
    return text.replace(
      /@(\w+)/g,
      '<span class="font-semibold text-gray-800">@$1</span>',
    );
  }
</script>

<template>
  <div class="group flex min-w-0 max-w-full items-start gap-2">
    <div
      class="min-w-0 max-w-full flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
    >
      <p
        class="flex h-8 min-w-0 items-center justify-end overflow-hidden bg-neutral-grey-300 px-2 text-right text-sm font-medium text-primary-400"
      >
        <span class="truncate">{{ author }}</span>
        <span class="mx-1.5 shrink-0">•</span>
        <span class="truncate">{{ message.createdAt }}</span>
      </p>
      <p
        class="min-h-12 min-w-0 max-w-full px-2 py-3 text-neutral-grey-1100 wrap-anywhere"
        v-html="highlightMentions(message.comment)"
      />
    </div>

    <div
      class="absolute -right-10 z-10 flex shrink-0 flex-col gap-1.5 pt-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
    >
      <button
        type="button"
        class="cursor-pointer p-1 text-neutral-grey-900 transition-colors hover:text-primary-500"
        @click="emits('reply')"
      >
        <MessageCirclePlusIcon :size="24" />
      </button>
      <button
        type="button"
        class="cursor-pointer p-1 text-neutral-grey-900 transition-colors hover:text-primary-500"
        @click="emits('like')"
      >
        <ThumbsUpIcon :size="24" />
      </button>
    </div>
  </div>
</template>

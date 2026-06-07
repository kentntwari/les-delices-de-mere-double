<script lang="ts" setup>
  import type { TOrderCommentDTO } from "~~/mvc/mapper/order";

  import { SendIcon, MessageSquareIcon } from "lucide-vue-next";

  const props = defineProps<{
    comments: TOrderCommentDTO[];
    isLoading: boolean;
    isSending: boolean;
    hasReachedLimit: boolean;
    error: string | null;
  }>();

  const emits = defineEmits<{
    (e: "send", comment: string): void;
  }>();

  const newComment = ref("");

  function handleSend() {
    if (!newComment.value.trim()) return;
    emits("send", newComment.value);
    newComment.value = "";
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <AppSkeletonTwoLines v-if="isLoading" />

    <template v-else>
      <div
        v-if="!comments.length"
        class="flex items-center gap-2 text-sm text-neutral-grey-1000"
      >
        <MessageSquareIcon :size="16" />
        <span>No comments yet.</span>
      </div>

      <ul
        v-else
        class="grid grid-rows-[1fr_auto] *:not-last:mb-3 max-h-[280px] overflow-y-auto"
      >
        <li
          v-for="comment in comments"
          :key="comment.id"
          class="w-full flex flex-col gap-0.5"
        >
          <div class="flex items-center gap-2">
            <span
              class="text-xs font-semibold text-secondary-1300 truncate max-w-[120px]"
            >
              {{ comment.userName || "Unknown" }}
            </span>
            <span class="text-xs text-neutral-grey-900">
              {{ comment.createdAt }}
            </span>
          </div>
          <p class="text-sm text-primary-500">{{ comment.comment }}</p>
        </li>
      </ul>

      <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

      <p v-if="hasReachedLimit" class="text-xs text-neutral-grey-900">
        Comment limit reached (10 max).
      </p>

      <form
        v-else
        class="flex items-center gap-2"
        @submit.prevent="handleSend"
      >
        <UIInput
          v-model="newComment"
          placeholder="Write a comment..."
          class="flex-1 text-sm"
          :maxlength="500"
          :disabled="isSending"
        />
        <UIButton
          type="submit"
          size="icon"
          variant="ghost"
          :disabled="isSending || !newComment.trim()"
        >
          <SendIcon :size="16" />
        </UIButton>
      </form>
    </template>
  </div>
</template>

<script lang="ts" setup>
  import type { TOrderCommentDetailsDTO } from "@repo/shared/mvc/mapper/comment";
  import { CornerUpRightIcon, ThumbsUpIcon, TrashIcon } from "lucide-vue-next";

  const props = defineProps<{
    author: string;
    message: TOrderCommentDetailsDTO;
  }>();

  const emits = defineEmits<{
    (e: "reply"): void;
    (e: "like"): void;
    (e: "delete", id: string): void;
  }>();

  function highlightMentions(text: string): string {
    return text.replace(
      /@(\w+)/g,
      '<span class="font-semibold text-gray-800">@$1</span>',
    );
  }
</script>

<template>
  <div class="grid grid-cols-3 grid-rows-auto">
    <span
      id="author"
      class="row-start-1 col-span-3 font-semibold text-sm text-primary-500"
      >{{ author }}</span
    >
    <span
      id="msg"
      class="mt-2 mb-3 row-start-2 col-span-3 font-medium text-sm text-neutral-grey-1100"
      >{{ message.comment }}</span
    >
    <span
      id="createdAt"
      class="row-start-3 col-start-1 col-end-3 text-xs text-neutral-grey-1000"
      >Sent {{ message.createdAt }}</span
    >
    <div
      id="action"
      class="row-start-3 col-start-3 text-xs text-neutral-grey-1000 justify-self-end *:text-neutral-grey-900 *:hover:text-neutral-grey-1100 *:hover:bg-neutral-grey-400 *:cursor-pointer"
    >
      <button class="px-2" @click="$emit('like')">
        <ThumbsUpIcon :size="16" />
      </button>
      <button class="px-2" @click="$emit('reply')">
        <CornerUpRightIcon :size="16" />
      </button>

      <UIAlertDialog>
        <UIAlertDialogTrigger as-child>
          <button class="px-2" aria-label="Delete comment">
            <TrashIcon :size="16" />
          </button>
        </UIAlertDialogTrigger>
        <UIAlertDialogContent>
          <UIAlertDialogHeader>
            <UIAlertDialogTitle>Delete comment?</UIAlertDialogTitle>
            <UIAlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              comment.
            </UIAlertDialogDescription>
          </UIAlertDialogHeader>
          <UIAlertDialogFooter>
            <UIAlertDialogCancel>Cancel</UIAlertDialogCancel>
            <UIAlertDialogAction @click="$emit('delete', message.id)"
              >Delete</UIAlertDialogAction
            >
          </UIAlertDialogFooter>
        </UIAlertDialogContent>
      </UIAlertDialog>
    </div>
  </div>
</template>

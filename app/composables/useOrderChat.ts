import { FetchError } from "ofetch";
import type { TOrderCommentDTO } from "~~/mvc/mapper/order";

const MAX_COMMENTS = 10;

export const useOrderChat = (
  orderId: Ref<string | undefined | null>,
  tab: Ref<"items" | "comments" | "logs">,
) => {
  const comments = ref<TOrderCommentDTO[]>([]);
  const isLoading = ref(false);
  const isSending = ref(false);
  const error = ref<string | null>(null);
  const hasReachedLimit = computed(() => comments.value.length >= MAX_COMMENTS);

  let eventSource: EventSource | null = null;
  let fetchController: AbortController | null = null;

  async function fetchComments() {
    if (!orderId.value) return;

    fetchController?.abort();
    fetchController = new AbortController();

    isLoading.value = true;
    error.value = null;

    try {
      const res = await $fetch<{ data: TOrderCommentDTO[] }>(
        `/api/order/${orderId.value}/comments`,
        {
          retry: 3,
          retryDelay: 500,
          timeout: 1000 * 10,
          signal: fetchController.signal,
        },
      );
      comments.value = res?.data || [];
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      error.value =
        e instanceof FetchError
          ? e.statusMessage || "Failed to fetch comments"
          : "Failed to fetch comments";
    } finally {
      isLoading.value = false;
    }
  }

  function openSSEStream() {
    closeSSEStream();

    if (!orderId.value || hasReachedLimit.value) return;

    eventSource = new EventSource(
      `/api/order/${orderId.value}/comments/stream`,
    );

    eventSource.onmessage = (event) => {
      try {
        const comment: TOrderCommentDTO = JSON.parse(event.data);

        const exists = comments.value.some((c) => c.id === comment.id);
        if (!exists) {
          comments.value = [...comments.value, comment];
        }

        if (hasReachedLimit.value) {
          closeSSEStream();
        }
      } catch {
        // Ignore parse errors from keepalive or malformed messages
      }
    };

    eventSource.onerror = () => {
      closeSSEStream();
    };
  }

  function closeSSEStream() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  }

  async function sendComment(commentText: string) {
    if (!orderId.value || !commentText.trim() || hasReachedLimit.value) return;

    isSending.value = true;
    error.value = null;

    try {
      await $fetch(`/api/order/${orderId.value}/comments`, {
        method: "POST",
        body: {
          comment: commentText.trim(),
        },
      });
    } catch (e) {
      error.value =
        e instanceof FetchError
          ? e.statusMessage || "Failed to send comment"
          : "Failed to send comment";
    } finally {
      isSending.value = false;
    }
  }

  watch(tab, (currentTab) => {
    if (currentTab === "comments" && orderId.value) {
      fetchComments().then(() => {
        if (!hasReachedLimit.value) {
          openSSEStream();
        }
      });
    } else {
      closeSSEStream();
    }
  });

  watch(orderId, () => {
    closeSSEStream();
    comments.value = [];
  });

  onBeforeUnmount(() => {
    closeSSEStream();
    fetchController?.abort();
  });

  return {
    comments,
    isLoading,
    isSending,
    error,
    hasReachedLimit,
    sendComment,
  };
};

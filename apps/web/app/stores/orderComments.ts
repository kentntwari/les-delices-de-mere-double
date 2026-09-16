import { defineStore } from "pinia";
import type {
  IApiOrderCommentData,
  IApiOrderCommentDeletedData,
} from "#shared/types";

interface ICommentId extends String {}
interface ITaggedUsername extends String {}
interface ITaggedUserId extends String {}

export const useOrderCommentsStore = defineStore("comments", () => {
  const currentOrderId = ref<string | null>(null);
  const comments = ref<IApiOrderCommentData[]>([]);
  const taggedUsers = reactive(new Map<ITaggedUsername, ITaggedUserId>([]));
  const requestsReplyComments = reactive(new Map<ICommentId, boolean>());

  const streamUrl = computed(() => {
    if (!currentOrderId.value) return undefined;
    return `/api/order/${currentOrderId.value}/comments/stream`;
  });

  const taggedUsersComputed = computed(() =>
    Array.from(taggedUsers.entries()).map(([name, id]) => ({
      name,
      id,
    })),
  );

  const repliedComments = computed(() =>
    Array.from(requestsReplyComments.entries())
      .filter(([_, isRequested]) => isRequested)
      .map(([commentId]) => commentId),
  );

  const { status, data, eventSource, error, close, open } = useEventSource<
    ["keepalive", "comment-deleted"],
    IApiOrderCommentData
  >(streamUrl, ["keepalive", 'comment-deleted'], {
    autoReconnect: {
      retries: 3,
      onFailed() {
        console.error(
          "Failed to reconnect to comments stream after 3 attempts.",
        );
      },
    },
    serializer: {
      read: (v?: string) => v && JSON.parse(v),
    },
  });

  function applyComment(newComment: IApiOrderCommentData) {
    if (!newComment) return;

    const existingCommentIndex = comments.value.findIndex(
      (comment) => comment.id === newComment.id,
    );

    if (existingCommentIndex >= 0) {
      comments.value.splice(existingCommentIndex, 1, newComment);
      return;
    }

    comments.value.push(newComment);
  }

  function removeComment(commentId: string) {
    comments.value = comments.value.filter(
      (comment) => comment.id !== commentId,
    );
    requestsReplyComments.delete(commentId as ICommentId);
  }

  whenever(data, (newComment) => {
    if (!newComment) return;
    applyComment(newComment);
  });

  watch(
    eventSource,
    (source, _, onCleanup) => {
      if (!source || !import.meta.env.DEV) return;

      const logHeartbeat = () => {
        console.log("comments stream heartbeat received");
      };

      const removeDeletedComment = (event: MessageEvent<string>) => {
        try {
          const payload = JSON.parse(event.data) as IApiOrderCommentDeletedData;
          removeComment(payload.id);
        } catch (parseError) {
          console.error(
            "Failed to parse deleted comment SSE payload",
            parseError,
          );
        }
      };

      source.addEventListener("keepalive", logHeartbeat);
      source.addEventListener(
        "comment-deleted",
        removeDeletedComment as EventListener,
      );

      onCleanup(() => {
        source.removeEventListener("keepalive", logHeartbeat);
        source.removeEventListener(
          "comment-deleted",
          removeDeletedComment as EventListener,
        );
      });
    },
    { immediate: true },
  );

  watch(status, (s) => {
    if (s === "CLOSED") {
      console.log("comments stream closed");
      untagAll();
    } else if (s === "OPEN") {
      console.log("comments stream opened");
      untagAll();
    } else if (s === "CONNECTING") {
      console.log("comments stream connecting");
    }
  });

  function tag(id: ITaggedUserId, name: ITaggedUsername) {
    if (!taggedUsers.has(name)) taggedUsers.set(name, id);
  }

  function untag(id: ITaggedUserId, name: ITaggedUsername) {
    if (taggedUsers.has(name)) taggedUsers.delete(name);
  }

  function untagAll() {
    taggedUsers.clear();
  }

  function reply(commentId: ICommentId) {
    unreplyAll();
    requestsReplyComments.set(commentId, true);
    console.log(requestsReplyComments);
  }

  function unreply(commentId: ICommentId) {
    requestsReplyComments.set(commentId, false);
  }

  function unreplyAll() {
    for (const commentId of requestsReplyComments.keys()) {
      requestsReplyComments.set(commentId, false);
    }
  }

  function mergeComments(
    baseComments: IApiOrderCommentData[],
    incomingComments: IApiOrderCommentData[],
  ) {
    const merged = new Map<string, IApiOrderCommentData>();

    for (const comment of baseComments) {
      merged.set(comment.id, comment);
    }

    for (const comment of incomingComments) {
      merged.set(comment.id, comment);
    }

    return Array.from(merged.values()).sort((left, right) => {
      return (
        new Date(left._meta.createdAt).getTime() -
        new Date(right._meta.createdAt).getTime()
      );
    });
  }

  function syncWithOrder(
    orderId: string | null | undefined,
    nextComments: IApiOrderCommentData[] | null | undefined,
  ) {
    const normalizedOrderId = orderId?.trim().toLowerCase() ?? null;
    const normalizedComments = nextComments ?? [];
    const hasOrderChanged = currentOrderId.value !== normalizedOrderId;

    if (hasOrderChanged) {
      currentOrderId.value = normalizedOrderId;
      untagAll();
      requestsReplyComments.clear();
      comments.value = [...normalizedComments];
      return;
    }

    comments.value = mergeComments(comments.value, normalizedComments);

    for (const comment of comments.value) {
      if (!requestsReplyComments.has(comment.id))
        requestsReplyComments.set(comment.id, false);
    }
  }

  function clear() {
    currentOrderId.value = null;
    comments.value = [];
    requestsReplyComments.clear();
    untagAll();
    close();
  }

  return {
    currentOrderId,
    comments,
    repliedComments,
    taggedUsers: taggedUsersComputed,
    syncWithOrder,
    clear,
    tagFn: { tag, untag, untagAll },
    streamFn: { close, open },
    replyFn: { reply, unreply, unreplyAll },
    commentFn: { applyComment, removeComment },
  };
});

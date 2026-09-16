<script lang="ts" setup>
  import { nanoid } from "nanoid";
  import { toTypedSchema } from "@vee-validate/zod";

  import { createOrderCommentSchema } from "@repo/shared/utils/schemas.zod";

  const props = defineProps<{
    orderId: string;
  }>();

  const { userId } = useAuth();
  const commentsStore = useOrderCommentsStore();

  const taggedUsers = computed(() =>
    commentsStore.taggedUsers.map((user) => user.id),
  );
  const replySourceId = computed(
    () => commentsStore.repliedComments.at(-1) ?? null,
  );

  const { errors, handleSubmit, isSubmitting, resetForm } = useForm({
    name: `chat-${props.orderId}-${nanoid()}`,
    validationSchema: toTypedSchema(createOrderCommentSchema),
    initialValues: {
      comment: "",
      userId: userId.value || "",
      orderId: props.orderId,
      createdAt: new Date().toISOString(),
    },
  });

  const onSubmit = handleSubmit((values) => {
    return $fetch(`/api/order/${props.orderId}/comments`, {
      method: "POST",
      body: {
        ...values,
        orderId: props.orderId,
        userId: userId.value || values.userId,
        createdAt: new Date().toISOString(),
        metadata: {
          sourceId: replySourceId.value,
          tagged: taggedUsers.value,
        },
      },
      onResponse() {
        resetForm();
        commentsStore.replyFn.unreplyAll();
        commentsStore.tagFn.untagAll();
      },
    });
  });
</script>

<template>
  <small v-show="isSubmitting">Sending...</small>
  <slot :tagged-users="taggedUsers" :submit="onSubmit" :errors="errors"></slot>
</template>

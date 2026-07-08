<script lang="ts" setup>
  import { nanoid } from "nanoid";
  import { toTypedSchema } from "@vee-validate/zod";

  import { createOrderCommentSchema } from "~~/shared/utils/schemas.zod";

  const props = defineProps<{
    orderId: string;
  }>();

  const { userId } = useAuth();
  const commentsStore = useOrderCommentsStore();

  const taggedUsers = computed(() =>
    commentsStore.taggedUsers.map((user) => user.id),
  );

  const { values, errors, handleSubmit, isSubmitting, setValues, resetForm } =
    useForm({
      name: `chat-${props.orderId}-${nanoid()}`,
      validationSchema: toTypedSchema(createOrderCommentSchema),
      initialValues: {
        comment: "",
        userId: userId.value || "",
        orderId: props.orderId,
        taggedUserIds: taggedUsers.value as string[],
        createdAt: new Date().toISOString(),
      },
    });

  const onSubmit = handleSubmit((values) => {
    return $fetch(`/api/order/${props.orderId}/comments`, {
      method: "POST",
      body: values,
      onRequest() {
        resetForm();
      },
    });
  });
</script>

<template>
  <small v-show="isSubmitting">Sending...</small>
  <slot :tagged-users="taggedUsers" :submit="onSubmit" :errors="errors"></slot>
</template>

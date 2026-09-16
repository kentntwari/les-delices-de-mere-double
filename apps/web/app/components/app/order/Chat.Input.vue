<script lang="ts" setup>
  import { nanoid } from "nanoid";
  import { SendHorizontalIcon } from "lucide-vue-next";
  import { onKeyStroke } from "@vueuse/core";

  const emit = defineEmits<{
    (e: "submit"): void;
  }>();

  const props = withDefaults(
    defineProps<{
      comment?: string;
      placeholder?: string;
    }>(),
    {
      placeholder: "Type your message...",
    },
  );

  const attrs = useAttrs();

  const inputId = `chat-${nanoid()}`;

  const { value, meta, validate, setValue } = useField<string>(
    "comment",
    toTypedSchema(createOrderCommentSchema.pick({ comment: true })),
    {
      initialValue: props.comment || "",
      validateOnValueUpdate: false,
    },
  );

  const handleSubmit = () => {
    validate().then((isValid) => isValid && emit("submit"));
  };

  onKeyStroke("Enter", (e) => {
    e.preventDefault();
    handleSubmit();
  });
</script>

<template>
  <div
    :class="
      cn(
        'w-full min-h-[40px] gap-2 flex items-center space-x-2 bg-transparent py-2 px-2.5 border border-neutral-grey-600 rounded-[8px]',
        typeof attrs.class === 'string' ? attrs.class : undefined,
      )
    "
  >
    <input
      :id="inputId"
      type="text"
      v-model="value"
      :placeholder="props.placeholder"
      class="text-neutral-grey-1300 placeholder:text-neutral-grey-1000 flex-1 outline-none"
    />
    <button
      type="button"
      @click="handleSubmit"
      class="bg-primary-500 rounded-[6px] p-1 text-white cursor-pointer disabled:cursor-not-allowed disabled:bg-neutral-grey-300 disabled:text-neutral-grey-500"
    >
      <SendHorizontalIcon :size="15" />
    </button>
  </div>
</template>

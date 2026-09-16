<script lang="ts" setup>
  interface Taggable {
    id: string;
    name: string;
  }
  const props = defineProps<{
    default?: Taggable;
    taggables: Taggable[];
  }>();

  const emits = defineEmits<{
    (e: "tag", value: Taggable): void;
  }>();

  const choice = ref<Taggable | undefined>(props.default);
</script>

<template>
  <UISelect v-model="choice">
    <UISelectTrigger
      class="data-[size=default]:h-11 bg-white border-neutral-grey-500 text-neutral-grey-1000"
    >
      <UISelectValue :aria-label="choice">{{ choice?.name }}</UISelectValue>
    </UISelectTrigger>
    <UISelectContent>
      <UISelectItem
        v-for="taggable in props.taggables"
        :key="taggable.id"
        :value="taggable"
        @select="emits('tag', taggable)"
      >
        {{ taggable.name }}
      </UISelectItem>
    </UISelectContent>
  </UISelect>
</template>

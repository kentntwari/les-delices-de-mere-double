<script lang="ts" setup>
  const props = defineProps<{
    item: TMenuSchema["items"][number];
  }>();
</script>
<template>
  <UIContextMenu>
    <UIContextMenuTrigger>
      <article
        class="px-4 py-3 space-y-6 bg-secondary-200 border border-secondary-200 rounded-xl"
      >
        <header class="block text-base text-neutral-grey-1000 uppercase">
          #{{ props.item.id }}
        </header>
        <footer class="flex flex-col gap-4">
          <p class="truncate text-xl text-primary-1300 font-medium">
            {{ props.item.title }}
          </p>
          <small class="text-base font-medium text-primary-500">
            ${{ props.item.unitPrice }}
          </small>
        </footer>
      </article>
    </UIContextMenuTrigger>
    <UIContextMenuContent>
      
    </UIContextMenuContent>
  </UIContextMenu>
</template>

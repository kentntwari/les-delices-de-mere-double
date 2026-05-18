<script lang="ts" setup>
  import { X, Trash2Icon, Trash } from "lucide-vue-next";

  defineProps<{
    type: "preview" | "edit";
    menuItems?: TMenuSchema["items"];
    currentItem: {
      title: string;
      quantity: number;
      unitPrice: number;
    };
  }>();

  const emits = defineEmits<{
    (e: "select-item", v: TMenuSchema["items"][number]): void;
    (e: "remove-item"): void;
    (e: "update-quantity", v: number): void;
  }>();
</script>

<template>
  <div class="w-full grid grid-cols-[1fr_auto] items-center gap-x-3">
    <div
      :class="
        cn(
          'px-1 flex items-center gap-x-2 lg:h-10 bg-secondary-200 rounded-sm',
          $attrs.class || '',
        )
      "
    >
      <template v-if="type === 'edit'">
        <UISelect :default-value="currentItem.quantity">
          <UISelectTrigger
            class="bg-neutral-grey-100 border-neutral-grey-600 data-[size=default]:h-8"
          >
            <UISelectValue class="text-secondary-1300" />
          </UISelectTrigger>
          <UISelectContent>
            <UISelectItem
              v-for="n in 10"
              :key="n"
              :value="n"
              @select="emits('update-quantity', n)"
            >
              {{ n }}
            </UISelectItem>
          </UISelectContent>
        </UISelect>

        <span class="block">
          <X :size="20" class="text-secondary-1300" />
        </span>

        <UISelect :default-value="currentItem.title">
          <UISelectTrigger
            class="bg-neutral-grey-100 border-neutral-grey-600 data-[size=default]:h-8 min-w-32"
          >
            <UISelectValue
              class="text-secondary-1300"
              :placeholder="'Select item...'"
            />
          </UISelectTrigger>
          <UISelectContent>
            <UISelectItem
              v-for="n in menuItems"
              :key="n.id"
              :value="n.title"
              @select="emits('select-item', n)"
            >
              {{ n.title }}
            </UISelectItem>
          </UISelectContent>
        </UISelect>

        <span class="flex-1 text-right text-secondary-1300">
          {{ currentItem.quantity }}*${{ currentItem.unitPrice }} = ${{
            currentItem.quantity * currentItem.unitPrice
          }}
        </span>
      </template>
      <template v-else>
        <span class="font-medium text-base text-secondary-1300">
          {{ currentItem.quantity }} x {{ currentItem.title }}
        </span>
        <span class="flex-1 text-right font-medium text-secondary-1300">
          {{ currentItem.quantity }} x ${{ currentItem.unitPrice }} = ${{
            currentItem.quantity * currentItem.unitPrice
          }}
        </span>
      </template>
    </div>
    <slot name="delete">
      <button
        class="cursor-pointer"
        v-show="type === 'edit'"
        :title="$t('components.order.create-panel.items-list.remove-item')"
        @click="emits('remove-item')"
      >
        <Trash2Icon
          :size="24"
          class="text-red-900 hover:text-red-700 transition-colors"
        />
      </button>
    </slot>
  </div>
</template>

<script lang="ts" setup>
  import { nanoid } from "nanoid";
  import { Plus, TriangleAlertIcon } from "lucide-vue-next";

  import { GET_MENU_ITEMS_KEY } from "~/app.keys";

  const props = defineProps<{
    data: TCreateOrderFormSchema["items"];
    totalAggregate: number;
  }>();

  const emits = defineEmits<{
    (e: "remove-all"): void;
  }>();

  const { data: menuItems } = useNuxtData<{ data: TMenuSchema }>(
    GET_MENU_ITEMS_KEY,
  );

  const { fields, push, remove, update } =
    useFieldArray<(typeof props.data)[number]>("items");
</script>

<template>
  <div
    class="flex flex-col gap-y-2"
    :class="[
      data.length > 0
        ? 'items-start justify-start'
        : 'items-center justify-center h-full',
    ]"
  >
    <div
      v-show="data.length > 0"
      class="mb-2 w-full flex items-center justify-between"
    >
      <small class="text-base">{{
        $t("components.order.create-panel.items-list.menu-header", {
          "item-count": fields.length,
        })
      }}</small>
      <UIButton
        :variant="'link'"
        class="text-red-700 hover:no-underline hover:text-red-900"
        @click="emits('remove-all')"
        >{{
          $t("components.order.create-panel.items-list.remove-all")
        }}</UIButton
      >
    </div>
    <p v-if="data.length === 0">
      {{ $t("components.order.create-panel.items-list.no-items") }}
    </p>
    <ul class="contents" v-else>
      <li
        v-for="(field, idx) in fields"
        class="w-full flex items-center gap-x-2"
      >
        <AppOrderPreviewEditPill
          :type="'edit'"
          :menu-items="menuItems?.data.items || []"
          :current-item="{
            title: field.value.title,
            quantity: field.value.quantity,
            unitPrice: field.value.unitPrice,
          }"
          @select-item="
            (item: TMenuSchema['items'][number]) =>
              update(idx, {
                ...field.value,
                id: item.id,
                title: item.title,
                unitPrice: item.unitPrice,
              })
          "
          @update-quantity="(q) => update(idx, { ...field.value, quantity: q })"
          @remove-item="remove(idx)"
        />
      </li>
    </ul>
    <button
      v-if="props.data.length < 7"
      type="button"
      class="min-w-32 lg:h-12 flex items-center justify-center gap-x-1 outline-2 outline-dashed outline-neutral-grey-700 hover:outline-neutral-grey-800 transition-colors duration-150 uppercase text-sm rounded-md cursor-pointer"
      :class="[data.length === 0 ? 'mt-4' : 'mt-0 w-full']"
      @click="
        push({
          id: nanoid(),
          title: '',
          quantity: 1,
          unitPrice: 0,
        })
      "
    >
      <span class="block">
        <Plus :size="16" />
      </span>
      <span class="block">
        {{ $t("components.order.create-panel.items-list.button-add-items") }}
      </span>
    </button>
    <p
      v-show="data.length === 7"
      class="w-full mt-2 font-regular text-sm text-orange-700 flex items-center gap-x-1"
    >
      <span class="inline-block"><TriangleAlertIcon :size="16" /></span>
      <span class="inline-block">You can only add up to 7 items per order</span>
    </p>
    <div
      v-show="data.length > 0"
      class="w-full lg:h-[120px] flex justify-between items-center"
    >
      <small class="text-base text-neutral-grey-1300">Total</small>
      <small class="text-base text-neutral-grey-1300"
        >${{ totalAggregate }}</small
      >
    </div>
  </div>
</template>

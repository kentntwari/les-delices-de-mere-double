<script lang="ts" setup>
  import { nanoid } from "nanoid";
  import { Plus, X, Info } from "lucide-vue-next";

  import {
    ContextMenu as UIContextMenu,
    ContextMenuTrigger as UIContextMenuTrigger,
    ContextMenuContent as UIContextMenuContent,
    ContextMenuItem as UIContextMenuItem,
  } from "~/components/ui/contextMenu";

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
        >Remove all</UIButton
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
        <UIContextMenu>
          <UIContextMenuTrigger as-child>
            <div
              class="w-full px-1 flex items-center gap-x-2 lg:h-10 bg-secondary-200 rounded-sm"
            >
              <Field
                :name="`items[${idx}].quantity`"
                v-slot="{ field: f, handleChange }"
                :keep-value="true"
              >
                <UISelect :default-value="f.value" v-model="f.value">
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
                      @select="(e: Event) => handleChange(n)"
                    >
                      {{ n }}
                    </UISelectItem>
                  </UISelectContent>
                </UISelect>
              </Field>

              <span class="block">
                <X :size="20" class="text-secondary-1300" />
              </span>

              <Field
                :name="`items[${idx}].title`"
                :keep-value="true"
                v-slot="{ field: f, handleChange }"
              >
                <UISelect :default-value="f.value" v-model="f.value">
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
                      v-for="n in menuItems?.data.items"
                      :key="n.id"
                      :value="n.title"
                      @select="
                        (e: Event) => {
                          update(idx, {
                            ...field.value,
                            id: n.id,
                            title: n.title,
                            unitPrice: n.unitPrice,
                          });
                        }
                      "
                    >
                      {{ n.title }}
                    </UISelectItem>
                  </UISelectContent>
                </UISelect>
              </Field>

              <span class="flex-1 text-right text-secondary-1300">
                {{ field.value.quantity }}*${{ field.value.unitPrice }} = ${{
                  field.value.quantity * field.value.unitPrice
                }}
              </span>
            </div>
          </UIContextMenuTrigger>
          <UIContextMenuContent
            class="min-w-20 bg-neutral-grey-200 border border-neutral-grey-600 rounded-md shadow-md"
          >
            <UIContextMenuItem
              class="font-regular text-red-700 focus:bg-transparent focus:text-red-800"
              @select="remove(idx)"
              >{{
                $t("components.order.create-panel.items-list.remove-item")
              }}</UIContextMenuItem
            >
          </UIContextMenuContent>
        </UIContextMenu>
      </li>
    </ul>
    <button
      v-if="props.data.length < 10"
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
      v-show="data.length === 10"
      class="w-full mt-2 font-regular text-sm text-neutral-grey-900 flex items-center gap-x-1"
    >
      <span class="inline-block"><Info :size="16" /></span>
      <span class="inline-block"
        >You can only add up to 10 items per order</span
      >
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

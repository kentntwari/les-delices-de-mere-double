<script lang="ts" setup>
  import { nanoid } from "nanoid";
  import { Plus, X } from "lucide-vue-next";

  import {
    ContextMenu as UIContextMenu,
    ContextMenuTrigger as UIContextMenuTrigger,
    ContextMenuContent as UIContextMenuContent,
    ContextMenuItem as UIContextMenuItem,
  } from "~/components/ui/contextMenu";

  const props = defineProps<{
    name: string;
    data: TCreateOrderFormSchema["items"];
  }>();

  const { fields, push, remove } =
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
                v-slot="{ field: f, handleChange }"
              >
                <UISelect>
                  <UISelectTrigger
                    class="bg-neutral-grey-100 border-neutral-grey-600 data-[size=default]:h-8 min-w-32"
                  >
                    <UISelectValue
                      class="text-secondary-1300"
                      :placeholder="'Select item'"
                    />
                  </UISelectTrigger>
                  <UISelectContent> </UISelectContent>
                </UISelect>
              </Field>

              <span class="flex-1 text-right text-secondary-1300">
                {{ field.value.title }}</span
              >

              <span class="flex-1 text-right text-secondary-1300">
                {{ field.value.quantity }}*${{ field.value.unitPrice }} =
                {{ field.value.quantity * field.value.unitPrice }}
              </span>
            </div>
          </UIContextMenuTrigger>
          <UIContextMenuContent
            class="min-w-20 bg-neutral-grey-200/70 border border-neutral-grey-600 rounded-md shadow-md"
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
  </div>
</template>

<script lang="ts" setup>
  import type { TProvidedInteractionState } from "~/types";
  import type { TCreateItemSchema, TUpdateItemIntents } from "#imports";
  import type { GenericObject } from "vee-validate";
  import type { FetchOptions } from "ofetch";

  import { toast } from "vue-sonner";

  import * as UISkeletonDefault from "~/components/ui/skeleton/Default.vue";
  import AppMenuCreate from "../../components/app/menu/Create.vue";
  import AppMenuItemCard from "../../components/app/menu/ItemCard.vue";

  import { GET_MENU_ITEMS_KEY, INJECT_FIRST_INTERACTION } from "~/app.keys";
  import { MenuItemEntity } from "~~/mvc/entities/item";
  import type { IMenuItemsCustomRequestHeaders } from "~~/shared/types";

  definePageMeta({
    name: "Menu",
  });

  const { data: res } = useNuxtData<{ data: TMenuSchema }>(GET_MENU_ITEMS_KEY);
  const freezed = Object.freeze(res.value);

  const interactionState = inject<TProvidedInteractionState>(
    INJECT_FIRST_INTERACTION,
    {
      isFirstInteraction: computed(() => "false" as const),
    },
  );

  const isOnboarding = computed(
    () =>
      interactionState.isFirstInteraction.value &&
      res.value?.data?.items?.length === 0,
  );

  const createNewItem = useDebounceFn(
    (
      v: GenericObject,
      options?: Omit<FetchOptions, "method" | "headers" | "body">,
    ) => {
      return $fetch("/api/item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: v,
        ...options,
      });
    },
    500,
  );

  const updateMenuItem = useDebounceFn(
    (
      v: Partial<TUpdateItemSchema>,
      intent: TUpdateItemIntents,
      options?: Omit<FetchOptions, "method" | "headers" | "body">,
    ) => {
      return $fetch("/api/item", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(intent === "UPDATE_TITLE"
            ? ({
                "X-Update-Title": "true",
              } satisfies IMenuItemsCustomRequestHeaders)
            : intent === "UPDATE_PRICING"
              ? ({
                  "X-Update-Pricing": "true",
                } satisfies IMenuItemsCustomRequestHeaders)
              : {}),
        },
        body: v,
        ...options,
      });
    },
    500,
  );

  const ITEM_TEMP_ID = "MI0000_TEMP" as const;
  function addOptimisticallyNewItem(v: TCreateItemSchema) {
    if (res.value?.data) {
      res.value = {
        data: {
          ...res.value.data,
          items: [
            ...res.value.data.items,
            {
              id: ITEM_TEMP_ID,
              title: v.title,
              slug: "",
              unitPrice: v.unitPrice,
            },
          ],
        },
      };
    }
  }

  function updateOptimisticallyMenuItem(
    v: Partial<TUpdateItemSchema>,
    intent: TUpdateItemIntents,
  ) {
    if (res.value?.data) {
      res.value = {
        data: {
          ...res.value.data,
          items: res.value.data.items.map((item) => {
            if (item.id !== v.id) return item;
            if (intent === "UPDATE_TITLE" && !v.title) return item;
            if (intent === "UPDATE_PRICING" && !v.unitPrice) return item;
            return {
              ...item,
              ...(intent === "UPDATE_TITLE"
                ? { title: v.title! }
                : intent === "UPDATE_PRICING"
                  ? { unitPrice: v.unitPrice! }
                  : {}),
            };
          }),
        },
      };
    }
  }

  function rollbackTemporaryItem() {
    if (res.value?.data) {
      res.value = {
        data: {
          ...res.value.data,
          items: res.value.data.items.filter(
            (item) => item.id !== ITEM_TEMP_ID,
          ),
        },
      };
    }
  }

  function rollbackUpdatedItem(id: string) {
    if (res.value?.data) {
      res.value = {
        data: {
          ...res.value.data,
          items: res.value.data.items.map((item) => {
            if (item.id !== id) return item;
            const originalItem = freezed?.data.items.find(
              (original) => original.id === id,
            );
            return originalItem ? { ...originalItem } : item;
          }),
        },
      };
    }
  }

  const appMenuCreateComponentBindings = {
    onCreate: (v: TCreateItemSchema) => {
      addOptimisticallyNewItem(v);
      if (isOnboarding.value) interactionState.markAppAsInteracted?.();
    },
    onCommit: (v: TCreateItemSchema) => {
      toast.promise(
        createNewItem(
          { ...v, id: MenuItemEntity.generateID() },
          {
            onRequestError() {
              appMenuCreateComponentBindings.onError();
            },
            onResponse() {
              appMenuCreateComponentBindings.onSuccess();
            },
            onResponseError() {
              appMenuCreateComponentBindings.onError();
            },
          },
        ),
        {
          loading: "Loading...",
          success: "Item created successfully!",
          error: "An error occurred while creating the item.",
        },
      );
    },
    onSuccess: () => {
      refreshNuxtData(GET_MENU_ITEMS_KEY);
    },
    onError: () => {
      rollbackTemporaryItem();
    },
  } satisfies InstanceType<typeof AppMenuCreate>["$props"];

  const appMenuItemCardComponentBindings = {
    onUpdate: (intent: TUpdateItemIntents, v: Partial<TUpdateItemSchema>) => {
      updateOptimisticallyMenuItem(v, intent);
    },
    onCommit: (intent: TUpdateItemIntents, v: Partial<TUpdateItemSchema>) => {
      if (
        intent === "UPDATE_TITLE" &&
        freezed?.data?.items
          ?.find((item) => item.id === v.id)
          ?.title?.trim()
          .toLowerCase() === v.title?.trim().toLowerCase()
      )
        return;

      if (
        intent === "UPDATE_PRICING" &&
        freezed?.data?.items?.find((item) => item.id === v.id)?.unitPrice ===
          v.unitPrice
      )
        return;
      else
        toast.promise(
          updateMenuItem(v, intent, {
            onRequestError() {
              appMenuItemCardComponentBindings.onError(
                v.id ?? "",
                "An error occurred while updating the item.",
              );
            },
            onResponse() {
              appMenuItemCardComponentBindings.onSuccess();
            },
            onResponseError() {
              appMenuItemCardComponentBindings.onError(
                v.id ?? "",
                "Could not update the item.",
              );
            },
          }),
          {
            loading: "Updating...",
            success: "Item updated successfully!",
            error: "An error occurred while updating the item.",
          },
        );
    },
    onSuccess: () => {
      refreshNuxtData(GET_MENU_ITEMS_KEY);
    },
    onError: (id: string, reason: string) => {
      try {
        toast.error(reason);
      } finally {
        rollbackUpdatedItem(id);
      }
    },
  } satisfies Omit<InstanceType<typeof AppMenuItemCard>["$props"], "item">;
</script>

<template>
  <section v-if="!res">
    <UISkeletonDefault />
  </section>
  <section
    v-else-if="isOnboarding"
    class="items h-full grid items-center justify-center gap-y-6"
  >
    <div class="flex flex-col items-center gap-y-6">
      <p class="lg:text-2xl text-primary-400">{{ $t("data.no-menu-items") }}</p>
      <AppMenuCreate v-bind="appMenuCreateComponentBindings" />
    </div>
  </section>
  <section class="grid grid-cols-2 gap-4" v-else>
    <aside class="col-span-full py-6 border-b border-neutral-grey-600">
      <div class="container flex justify-between items-center">
        <header class="space-x-4">
          <h1 class="text-primary-1300 font-medium text-2xl lowercase">
            {{ res.data.items.length }} {{ $t("pages.menu.header-title") }}
          </h1>
        </header>
        <footer>
          <AppMenuCreate v-bind="appMenuCreateComponentBindings" />
        </footer>
      </div>
    </aside>

    <div class="container col-span-full mt-4 grid grid-cols-4 gap-4">
      <AppMenuItemCard
        v-for="item in res.data.items"
        :key="item.id"
        :item="item"
        class="col-span-1"
        v-bind="appMenuItemCardComponentBindings"
      />
    </div>
  </section>
</template>

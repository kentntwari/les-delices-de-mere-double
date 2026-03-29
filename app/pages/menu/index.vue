<script lang="ts" setup>
  import type { TProvidedInteractionState } from "~/types";
  import type { TCreateItemSchema, TUpdateItemIntents } from "#imports";
  import type { GenericObject } from "vee-validate";
  import type { FetchOptions } from "ofetch";
  import type { IMenuItemsCustomRequestHeaders } from "~~/shared/types";

  import { toast } from "vue-sonner";
  import { ShieldAlertIcon } from "lucide-vue-next";

  import AppMenuCreate from "../../components/app/menu/Create.vue";
  import AppMenuItemCard from "../../components/app/menu/ItemCard.vue";

  import { GET_MENU_ITEMS_KEY, INJECT_FIRST_INTERACTION } from "~/app.keys";
  import { MenuItemEntity } from "~~/mvc/entities/item";

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

  const hasMenu = computed(() => {
    if (isOnboarding.value) return false;
    if (!res.value) return false;
    if (!res.value.data) return false;
    if (res.value.data.items.length === 0) return false;
    return true;
  });

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

  const deleteMenuItem = useDebounceFn(
    (
      id: string,
      options?: Omit<FetchOptions, "method" | "headers" | "body">,
    ) => {
      return $fetch("/api/item/" + id, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: { id },
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

  function removeOptimisticallyDeletedItem(id: string) {
    if (res.value?.data) {
      res.value = {
        data: {
          ...res.value.data,
          items: res.value.data.items.filter((item) => item.id !== id),
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
    onDelete: (id: string) => {
      removeOptimisticallyDeletedItem(id);

      toast.promise(
        deleteMenuItem(id, {
          onRequestError() {
            appMenuItemCardComponentBindings.onError(
              id,
              "An error occurred while deleting the item.",
            );
          },
          onResponse() {
            appMenuItemCardComponentBindings.onSuccess();
          },
          onResponseError() {
            appMenuItemCardComponentBindings.onError(
              id,
              "Could not delete the item.",
            );
          },
        }),
        {
          loading: "Deleting...",
          success: "Item deleted successfully!",
          error: "An error occurred while deleting the item.",
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
  <section class="h-full" v-if="!res">
    <AppSkeletonDefault class="container" />
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
  <section class="h-full gap-4" v-else>
    <aside class="col-span-full py-6 border-b border-neutral-grey-600">
      <div class="container flex justify-between items-center">
        <header class="space-x-4">
          <h1 class="text-primary-1300 font-medium text-2xl lowercase">
            {{
              $t("pages.menu.header-title", {
                "items-count": res.data.items.length,
              })
            }}
          </h1>
        </header>
        <footer>
          <AppMenuCreate v-bind="appMenuCreateComponentBindings" />
        </footer>
      </div>
    </aside>

    <div class="container col-span-full mt-4 grid grid-cols-4 gap-4">
      <div
        class="mb-2 w-full h-10 col-span-full flex items-center gap-x-2 rounded-lg"
        role="banner"
      >
        <ShieldAlertIcon :size="20" class="text-primary-500" />
        <p class="text-sm text-primary-500">
          {{
            $t(
              "pages.menu.onboarding-warning",
              "Right click on an item for more options.",
            )
          }}
        </p>
      </div>
      <p
        class="col-span-full flex items-center justify-center text-center text-2xl text-primary-400"
        v-show="!hasMenu"
      >
        {{ $t("pages.menu.no-items") }}
      </p>
      <AppMenuItemCard
        v-for="item in res.data.items"
        :key="item.id"
        :item="item"
        class="col-span-1"
        v-bind="appMenuItemCardComponentBindings"
        v-show="hasMenu"
      />
    </div>
  </section>
</template>

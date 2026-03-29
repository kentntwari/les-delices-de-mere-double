<script setup lang="ts">
  import "vue-sonner/style.css";
  import { GET_MENU_ITEMS_KEY } from "./app.keys";

  useLazyFetch<{ data: TMenuSchema }>("/api/items/menu", {
    key: GET_MENU_ITEMS_KEY,
    default: () => ({ data: { items: [] } }),
    priority: "high",
    immediate: true,
    onResponseError: ({ response }) => {
      showError({
        statusCode: response.status,
        statusMessage:
          response.statusText === "Unauthorized"
            ? "You lack proper permissions to access this resource. Please follow up with your administrator for more information."
            : "An unexpected error occurred while fetching menu data.",
      });
    },
  });
</script>
<template>
  <NuxtLayout>
    <main>
      <NuxtPage />
    </main>
    <UIToaster
      :position="'bottom-center'"
      :toast-options="{
        unstyled: true,
        class:
          'h-12 min-w-80 px-3 py-2 ml-[30%] bg-neutral-grey-200 rounded-lg border flex justify-center items-center gap-x-1',
        classes: {
          loading: 'border-neutral-grey-600',
          success: 'text-green-700 border-green-400 ',
          error: 'text-red-700 border-red-400 ',
        },
      }"
    />
  </NuxtLayout>
</template>

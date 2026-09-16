import type { UseFetchOptions } from "#app";

export function useRefreshApiDataUtils<T>(key: string) {
  const shouldBypassCache = ref(false);

  async function refreshOrders() {
    shouldBypassCache.value = true;
    await refreshNuxtData(key);
    shouldBypassCache.value = false;
  }

  const getCachedData: UseFetchOptions<T>["getCachedData"] = (
    key: string,
    nuxtApp,
  ) => {
    if (shouldBypassCache.value) return undefined;
    return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key] ?? undefined;
  };

  return {
    shouldBypassCache,
    refreshOrders,
    getCachedData,
  };
}

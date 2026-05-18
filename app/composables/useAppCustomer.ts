import type { TCustomerFullDTO } from "~~/mvc/mapper/customer";

const CACHE_KEY_PREFIX = "app_customer_";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_ENTRIES = 3;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getFromSessionStorage(customerId: string): TCustomerFullDTO | null {
  try {
    const key = CACHE_KEY_PREFIX + customerId;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;

    const entry: CacheEntry<TCustomerFullDTO> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

function getCacheKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(CACHE_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

function clearAllCacheKeys(): void {
  const keys = getCacheKeys();
  for (const key of keys) {
    sessionStorage.removeItem(key);
  }
}

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const key of getCacheKeys()) {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) continue;

      const entry: CacheEntry<unknown> = JSON.parse(raw);
      if (now - entry.timestamp > CACHE_TTL_MS) {
        sessionStorage.removeItem(key);
      }
    } catch {
      sessionStorage.removeItem(key);
    }
  }
}

function enforceSessionStorageLimit(): void {
  const keys = getCacheKeys();
  if (keys.length < MAX_CACHE_ENTRIES) return;

  const entries: { key: string; timestamp: number }[] = [];
  for (const key of keys) {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const parsed: CacheEntry<unknown> = JSON.parse(raw);
        entries.push({ key, timestamp: parsed.timestamp });
      }
    } catch (error) {
      console.error("Failed to parse cache entry:", error);
      sessionStorage.removeItem(key);
    }
  }

  entries.sort((a, b) => a.timestamp - b.timestamp);

  const toRemove = entries.length - MAX_CACHE_ENTRIES + 1;
  for (let i = 0; i < toRemove; i++) {
    const entry = entries[i];
    if (entry) sessionStorage.removeItem(entry.key);
  }
}

function setToSessionStorage(customerId: string, data: TCustomerFullDTO): void {
  try {
    enforceSessionStorageLimit();

    const key = CACHE_KEY_PREFIX + customerId;
    const entry: CacheEntry<TCustomerFullDTO> = {
      data,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error("Failed to write to sessionStorage:", error);
    if (error instanceof DOMException && error.name === "QuotaExceededError")
      clearAllCacheKeys();
  }
}

export const useAppCustomer = (id: Ref<string | undefined | null>) => {
  let controller = new AbortController();

  // Clean up expired sessionStorage entries on init to prevent accumulation
  cleanupExpiredEntries();

  const fetchCustomerById = async (
    customerId: string,
  ): Promise<TCustomerFullDTO | null> => {
    const cached = getFromSessionStorage(customerId);
    if (cached) return cached;

    controller.abort();
    controller = new AbortController();

    const response = await $fetch<{ data: TCustomerFullDTO }>(
      `/api/customer/${encodeURIComponent(customerId)}`,
      {
        retry: 3,
        retryDelay: 500,
        timeout: 10_000,
        signal: controller.signal,
      },
    );

    const customer = response?.data ?? null;
    if (customer) {
      setToSessionStorage(customerId, customer);
    }

    return customer;
  };

  const memoizedFetch = useMemoize(fetchCustomerById);

  onUnmounted(() => {
    controller.abort();
  });

  const asyncState = useAsyncState<TCustomerFullDTO | null>(
    () => {
      if (!id.value) return Promise.resolve(null);
      return memoizedFetch(id.value);
    },
    null,
    {
      immediate: false,
      onError(error) {
        console.error("Failed to fetch customer:", error);
      },
    },
  );

  function setId(newId: string | undefined | null): void {
    id.value = newId;
  }

  function execute(): void {
    if (!id.value) return;
    memoizedFetch.delete(id.value);
    asyncState.execute(0);
  }

  return {
    customer: asyncState.state,
    isLoading: asyncState.isLoading,
    isReady: asyncState.isReady,
    error: asyncState.error,
    setId,
    execute,
  };
};

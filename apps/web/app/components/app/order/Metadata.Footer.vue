<script lang="ts" setup>
  import {
    FileChartColumnIcon,
    ThermometerIcon,
    TruckIcon,
    ClockIcon,
    CircleUserIcon,
    ShoppingCartIcon,
    ExternalLinkIcon,
  } from "lucide-vue-next";

  type MetaDataLabels = [
    "status",
    "paymentStatus",
    "customerName",
    "createdAt",
    "deliveryStatus",
  ];

  const props = defineProps<{
    order:
      | (IApiOrderData & {
          timeline: { createdAt: string | null; updatedAt: string | null };
        })
      | null;
    restricted?: MetaDataLabels[];
  }>();

  const normalizeMetaValue = (
    value: string | null | undefined,
    fallback = "--",
  ) => {
    if (!value) return fallback;

    const normalized = value
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .trim()
      .toLowerCase();

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const normalizedOrderStatus = computed(() =>
    normalizeMetaValue(props.order?.status),
  );

  const normalizedPaymentStatus = computed(() =>
    normalizeMetaValue(props.order?.paymentStatus),
  );

  const normalizedCustomerName = computed(
    () => props.order?._meta.customer?.name ?? "--",
  );

  const normalizedDeliveryStatus = computed(() =>
    normalizeMetaValue(props.order?._meta.delivery?.status),
  );

  const normalizedCreatedAt = computed(
    () => props.order?.timeline?.createdAt ?? "--",
  );

  // TODO: Enforce rules so that restricted labels cannot contain all the available labels. At least one must be shown
  // TODO: Possibly show an error if the above is not respected
  // FIX: Provide the classes downards to children
</script>

<template>
  <footer
    class="space-x-8 *:inline-flex *:items-center"
    aria-label="essential order information footer"
  >
    <div>
      <span class="text-primary-500">
        <ThermometerIcon class="size-5 inline align-text-bottom" />
      </span>
      <span class="text-primary-500">Status: {{ " " }}</span>
      <span class="ml-1 text-primary-1100">{{ normalizedOrderStatus }}</span>
    </div>
    <div>
      <span class="mr-1 text-primary-500">
        <FileChartColumnIcon class="size-5 inline align-text-bottom" />
      </span>
      <span class="text-primary-500">Payment: {{ " " }}</span>
      <span class="ml-1 text-primary-1100">{{ normalizedPaymentStatus }}</span>
    </div>
    <div>
      <span class="mr-1 text-primary-500">
        <CircleUserIcon class="size-5 inline align-text-bottom" />
      </span>
      <span class="text-primary-500">Customer: {{ " " }}</span>
      <span class="ml-1 text-primary-1100">
        {{ normalizedCustomerName }}
      </span>
    </div>
    <div>
      <span class="mr-1 text-primary-500">
        <ClockIcon class="size-5 inline align-text-bottom" />
      </span>
      <span class="text-primary-500">Created on: {{ " " }}</span>
      <span class="ml-1 text-primary-1100">{{ normalizedCreatedAt }}</span>
    </div>
    <div>
      <span class="mr-1 text-primary-500">
        <ShoppingCartIcon class="size-5 inline align-text-bottom" />
      </span>
      <span class="text-primary-500">Delivery status: {{ " " }}</span>
      <span class="ml-1 text-primary-1100">{{ normalizedDeliveryStatus }}</span>
      <button
        aria-label="View delivery details"
        class="ml-2 text-primary-500 cursor-pointer"
      >
        <ExternalLinkIcon class="size-5 inline align-text-bottom" />
      </button>
    </div>
    <slot />
  </footer>
</template>

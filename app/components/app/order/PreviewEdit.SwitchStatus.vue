<script lang="ts" setup>
  import type { TOrderDTO } from "~~/mvc/mapper/order";

  const props = defineProps<{
    currentStatus: TOrderDTO["status"];
  }>();

  const emits = defineEmits<{
    (e: "update", value: TOrderDTO["status"]): void;
  }>();

  type TStatusOption = {
    label: string;
    value: TOrderDTO["status"];
  };
  const statusOptions: TStatusOption[] = [
    { label: "In progress", value: "IN_PROGRESS" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Not started", value: "NOT_STARTED" },
  ];

  const selectedStatus = ref(
    statusOptions.at(
      statusOptions.findIndex((o) => o.value === props.currentStatus),
    )?.value || null,
  );

  function convertStatusToLabel(status: TOrderDTO["status"]): string {
    return (
      statusOptions.at(statusOptions.findIndex((o) => o.value === status))
        ?.label || ""
    );
  }

  const isDialogOpen = ref(false);
  const isAlertOpen = ref(false);
</script>
<template>
  <UIAlertDialog v-model:open="isAlertOpen">
    <UISelect v-model:open="isDialogOpen" v-model:model-value="selectedStatus">
      <UISelectTrigger
        class="px-2 h-7 border-0 font-medium uppercase text-xs"
        :class="[
          props.currentStatus === selectedStatus
            ? resolveOrderStatusClass(selectedStatus)
            : resolveOrderStatusClass(props.currentStatus),
        ]"
        >{{
          convertStatusToLabel(props.currentStatus || "NOT_STARTED")
        }}</UISelectTrigger
      >
      <UISelectContent>
        <UISelectItem
          v-for="option in statusOptions"
          :key="option.value"
          :value="option.value"
          @select="
            () => {
              selectedStatus = option.value;
              isAlertOpen = true;
            }
          "
        >
          {{ option.label }}
        </UISelectItem>
      </UISelectContent>
    </UISelect>
    <UIAlertDialogContent>
      <UIAlertDialogHeader>
        <UIAlertDialogHeader class="text-primary-1300">
          <UIAlertDialogTitle>
            Are you sure you want to change the order status to
            <span class="text-primary-500"
              >"{{
                selectedStatus ? convertStatusToLabel(selectedStatus) : ""
              }}"?</span
            >
          </UIAlertDialogTitle>
          <UIAlertDialogDescription>
            {{ $t("components.alerts.order.change-order-status.description") }}
          </UIAlertDialogDescription>
        </UIAlertDialogHeader>
      </UIAlertDialogHeader>
      <UIAlertDialogFooter>
        <UIButton variant="outline" @click="isAlertOpen = false"
          >Cancel</UIButton
        >
        <UIButton
          @click="
            () => {
              selectedStatus ? emits('update', selectedStatus) : void null;
              isAlertOpen = false;
            }
          "
          >Confirm</UIButton
        >
      </UIAlertDialogFooter>
    </UIAlertDialogContent>
  </UIAlertDialog>
</template>

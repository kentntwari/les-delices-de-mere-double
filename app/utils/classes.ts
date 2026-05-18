import type { TOrderDTO } from "~~/mvc/mapper/order";

export function resolveOrderStatusClass(status: TOrderDTO["status"]): string {
  switch (status) {
    case "NOT_STARTED":
      return "bg-neutral-grey-700";
    case "IN_PROGRESS":
      return "bg-[#51bd28]/60";
    case "COMPLETED":
      return "bg-green-500";
    case "CANCELLED":
      return "bg-red-100";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

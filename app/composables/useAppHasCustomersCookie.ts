import { HAS_CUSTOMERS_COOKIE } from "~/app.keys";
import {
  decodeHasCustomersCookie,
  encodeHasCustomersCookie,
} from "~/utils/hasCustomersCookie";

export function useAppHasCustomersCookie() {
  const rawCookie = useCookie<string>(HAS_CUSTOMERS_COOKIE, {
    default: () => encodeHasCustomersCookie(false),
    watch: "shallow",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "strict",
    secure: true,
  });

  const hasCustomers = computed(() =>
    decodeHasCustomersCookie(rawCookie.value),
  );

  function setHasCustomers(value: boolean) {
    rawCookie.value = encodeHasCustomersCookie(value);
  }

  return {
    rawCookie,
    hasCustomers,
    setHasCustomers,
  };
}

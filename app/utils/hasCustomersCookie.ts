const ENCODED_TRUE = "MQ==";
const ENCODED_FALSE = "MA==";

export function encodeHasCustomersCookie(value: boolean): string {
  return value ? ENCODED_TRUE : ENCODED_FALSE;
}

export function decodeHasCustomersCookie(
  value: string | null | undefined,
): boolean {
  if (!value) return false;
  if (value === ENCODED_TRUE) return true;
  if (value === ENCODED_FALSE) return false;
  return false;
}

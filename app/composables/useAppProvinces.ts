const provinceMap = {
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  NT: "Northwest Territories",
  NU: "Nunavut",
  YT: "Yukon",
} as const;

type TProvinceCode = keyof typeof provinceMap;

export function useAppProvinces() {
  const provinces = computed(() => provinceMap);

  function normalizeProvince(value?: string): string {
    if (!value) return "";

    const trimmedValue = value.trim();

    if (trimmedValue in provinceMap) return trimmedValue;

    const matchedProvince = Object.entries(provinceMap).find(
      ([, label]) => label.toLowerCase() === trimmedValue.toLowerCase(),
    );

    return matchedProvince?.[0] || trimmedValue;
  }

  function resolveProvinceLabel(value?: string): string {
    const normalizedProvince = normalizeProvince(value);

    return provinces.value[normalizedProvince as TProvinceCode] || value || "";
  }

  return {
    provinces,
    normalizeProvince,
    resolveProvinceLabel,
  };
}

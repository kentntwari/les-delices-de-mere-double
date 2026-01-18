import { nanoid } from "nanoid";

export const useFocusInput = (
  condition: Ref<boolean>,
  customRefId?: string,
) => {
  const inputRef = useTemplateRef<HTMLInputElement>(
    customRefId ?? "input-elt" + nanoid(),
  );

  const isInputUnfocusable = ref(false);

  const doesInputRefExist = computed(() => !!inputRef.value);

  watch([doesInputRefExist, condition], async ([doesExist, conditionMet]) => {
    if (doesExist && conditionMet) {
      await nextTick();
      let attempts = 0;
      const maxAttempts = 20; // ~1s total
      const interval = setInterval(() => {
        attempts++;
        if (inputRef.value) {
          inputRef.value.focus();
          clearInterval(interval);
        } else if (attempts >= maxAttempts) {
          console.warn("inputRef not attached to input after waiting");
          isInputUnfocusable.value = true;
          clearInterval(interval);
        }
      }, 50);
    }
  });

  return {
    inputRef,
    isInputUnfocusable,
  };
};

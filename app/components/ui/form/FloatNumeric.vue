<script setup lang="ts">
  defineProps<{
    label: string;
    title?: string;
    placeholder?: string;
  }>();

  defineOptions({
    inheritAttrs: false,
  });

  const inputValue = ref("");

  const isValidCharacter = (char: string) => {
    // Only allow digits and decimal point
    return /^[0-9.]$/.test(char);
  };

  const sanitizeValue = (value: string) => {
    // Remove all invalid characters
    let sanitized = value.replace(/[^0-9.]/g, "");

    // Ensure only one decimal point
    const parts = sanitized.split(".");
    if (parts.length > 2) {
      sanitized = parts[0] + "." + parts.slice(1).join("");
    }

    return sanitized;
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    const char = event.key;
    const currentValue = inputValue.value;

    // Block invalid characters
    if (!isValidCharacter(char)) {
      event.preventDefault();
      return;
    }

    // Block multiple decimal points
    if (char === "." && currentValue.includes(".")) {
      event.preventDefault();
      return;
    }
  };

  const handlePaste = (event: ClipboardEvent) => {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData("text") || "";
    const sanitized = sanitizeValue(pastedText);

    // Insert sanitized text at cursor position
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentValue = inputValue.value;

    inputValue.value =
      currentValue.substring(0, start) +
      sanitized +
      currentValue.substring(end);

    // Set cursor position after inserted text
    const newPosition = start + sanitized.length;
    setTimeout(() => {
      input.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleInput = (event: Event) => {
    const sanitized = sanitizeValue((event.target as HTMLInputElement).value);
    if (sanitized !== (event.target as HTMLInputElement).value) {
      inputValue.value = sanitized;
    }
  };
</script>

<template>
  <div>
    <label
      for="numeric"
      :title="title || label"
      class="block text-neutral-grey-1100 mb-[5px]"
    >
      {{ label }}
    </label>
    <input
      id="numeric"
      v-bind="{ ...$attrs }"
      v-model="inputValue"
      type="text"
      inputmode="decimal"
      :placeholder="placeholder || '0.00'"
      :class="
        cn(
          'bg-white w-full h-10 text-neutral-grey-1300 outline outline-neutral-grey-500 focus:neutral-grey-900 focus:ring-2 focus:ring-neutral-grey-900 rounded-lg pl-3 pr-2',
          $attrs.class || ''
        )
      "
      @keypress="handleKeyPress"
      @paste="handlePaste"
      @input="handleInput"
    />
  </div>
</template>

<script lang="ts" setup>
  import type { NuxtError } from "#app";
  import type { TNuxtErrorCause } from "../app/types";

  interface NuxtErrorWithCause extends NuxtError {
    data?: {
      cause?: string & TNuxtErrorCause;
    };
  }

  const props = defineProps<{ error: NuxtErrorWithCause }>();

  const { locale } = useI18n();

  const canTranslate = computed(() => {
    if (
      props.error.data &&
      typeof props.error.data === "object" &&
      "cause" in props.error.data
    ) {
      return true;
    }

    return false;
  });

  // INFO: Refer to errorMap in shared/utils/errorMap.ts
  // FIX: Must properly translate error messages based on error codes
  function matchErrorCause(
    cause: NonNullable<NuxtErrorWithCause["data"]>["cause"] | undefined,
    defaultErrorMsg: string
  ) {
    if (!cause) return defaultErrorMsg;
    switch (cause) {
      case "user.status.rejected":
        return $t("errors.user.status-rejected");
      default:
        return defaultErrorMsg;
    }
  }
</script>

<template>
  <NuxtLayout>
    <main class="container">
      <div class="w-fit mx-auto lg:my-70 space-y-4">
        <h1 class="font-bold lg:text-2xl text-center text-neutral-grey-1300">
          {{ locale === "en" ? "Uh oh" : "Oups" }}
        </h1>
        <p class="text-lg text-center">
          {{
            locale === "en" ? "An error occurred" : "Une erreur s'est produite"
          }}
        </p>
        <!-- TODO: Implement dynamic error message translation -->
        <!-- INFO: Refer to errorMap in shared/utils/errorMap.ts -->
        <!-- FIX: Figure out how to translate error messages based on error codes -->
        <span
          class="block max-w-prose lg:max-w-lg text-center font-regular text-pretty"
          >{{
            locale !== "en" && canTranslate
              ? matchErrorCause(
                  props.error.data!.cause,
                  props.error.statusMessage || props.error.message
                )
              : props.error.statusMessage
          }}</span
        >
      </div>
    </main>
  </NuxtLayout>
</template>

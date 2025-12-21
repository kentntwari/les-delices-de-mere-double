<script setup lang="ts">
  import type { TNuxtErrorCause } from "~/types";
  import { INJECT_FIRST_INTERACTION } from "@/app.keys";

  const { isSignedIn, userId, isLoaded } = useAuth();

  const isFirstAppInteraction = useCookie("__client_first__app__interaction", {
    default: () => "true",
    watch: "shallow",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });

  // WARNING: Must never be accessed
  const userStatus = useState<IUserMeta["status"]>("__READ_ONLY__USER_STATUS");
  await callOnce(async () => {
    // FIX: Must throw if api shape response is not what we expect
    if (isSignedIn.value) {
      const api = await $fetch<{ status: IUserMeta["status"] }>(
        "/api/user/" + userId.value + "/status"
      );
      userStatus.value = api.status;

      if (userStatus.value === "REJECTED") {
        showError({
          statusCode: 403,
          statusMessage:
            "You cannot access the application. Please follow up with your administrator for more information.",
          data: {
            cause: "user.status.rejected" satisfies TNuxtErrorCause,
          },
        });
      }
    }
  });

  function markAppAsInteracted() {
    isFirstAppInteraction.value = "false";
  }

  provide(INJECT_FIRST_INTERACTION, {
    t: isFirstAppInteraction.value,
    markAppAsInteracted,
  });
</script>
<template>
  <div
    v-show="!isLoaded"
    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 loader"
  ></div>
  <div v-show="isLoaded">
    <div class="min-h-[100dvh] min-h-screen grid grid-rows-[auto_1fr_auto]">
      <AppNavigation :currentStatus="userStatus" />

      <template v-if="!isSignedIn">
        <AppWizardStartUp>
          <SignInButton
            class="flex items-center gap-x-2 text-neutral-grey-1300 cursor-pointer hover:text-accent-one-1100"
            title="Sign in to app"
            >{{ $t("signIn") }}
            <Icon name="lucide:chevron-right" size="20" />
          </SignInButton>
        </AppWizardStartUp>
      </template>

      <template v-else>
        <slot />
      </template>

      <footer class="container lg:mb-6 text-neutral-grey-1000">
        <small class="inline-block">
          <Icon name="lucide:copyright" size="18" />
        </small>
        <small class="inline-block ml-1">Copyright 2025</small>
      </footer>
    </div>
  </div>
</template>

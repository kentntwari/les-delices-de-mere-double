<script setup lang="ts">
  import type { TNuxtErrorCause, TProvidedInteractionState } from "~/types";
  import {
    FIRST_INTERACTION_COOKIE,
    INJECT_FIRST_INTERACTION,
    READ_ONLY_USER_STATUS,
  } from "@/app.keys";
  import { UserEntity } from "~~/mvc/entities/user";

  const { isSignedIn, userId, isLoaded } = useAuth();

  const isFirstAppInteraction = useCookie(FIRST_INTERACTION_COOKIE, {
    default: () => "true",
    watch: "shallow",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });

  // WARNING: Must never be accessed
  const userStatus = useState<IUserMeta["status"]>(READ_ONLY_USER_STATUS);
  
  await callOnce(async () => {
    // FIX: Must throw if api shape response is not what we expect
    if (isSignedIn.value) {
      const api = await $fetch<{ data: UserEntity["_status"] }>(
        "/api/user/" + userId.value + "/status",
      ).catch((e) => console.log(e));

      userStatus.value = api?.data || "REJECTED";

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

  provide<TProvidedInteractionState>(INJECT_FIRST_INTERACTION, {
    isFirstInteraction: computed(
      () => isFirstAppInteraction.value as "true" | "false",
    ),
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

      <footer class="container flex lg:mb-6 text-neutral-grey-1000">
        <small class="inline-block">
          <Icon name="lucide:copyright" size="18" />
        </small>
        <small class="inline-block ml-1">Copyright 2025</small>
        <small class="block flex-1 text-right"> Designed by Kent Ntwari </small>
      </footer>
    </div>
  </div>
</template>

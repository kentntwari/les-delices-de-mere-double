import type { $Enums } from "@prisma/client";

// TODO:extend as errors are implemented from the server to the client
export type TNuxtErrorCause =
  | "user.status.rejected"
  | "user.status.pending"
  | "user.not.found";

import type { ComputedRef } from "vue";

export type TProvidedInteractionState = {
  isFirstInteraction: ComputedRef<"true" | "false">;
  markAppAsInteracted?: () => void;
};

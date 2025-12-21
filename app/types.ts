// TODO:extend as errors are implemented from the server to the client
export type TNuxtErrorCause =
  | "user.status.rejected"
  | "user.status.pending"
  | "user.not.found";

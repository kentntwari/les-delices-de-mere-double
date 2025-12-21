interface IUserErrors {
  NOT_FOUND: string;
  INVALID_CREDENTIALS: string;
  UNAUTHORIZED: string;
  STATUS_REJECTED?: string;
}

interface IApiErrors {
  UNAUTHORIZED: string;
  METHOD_NOT_ALLOWED: string;
  NOT_IMPLEMENTED: string;
}

interface IGeneralErrors {
  INTERNAL_SERVER_ERROR: string;
  BAD_REQUEST: string;
  UNABLE_TO_PROCESS?: string;
}

export const errorMap = {
  sys: {
    user: {
      NOT_FOUND: "User not found",
      INVALID_CREDENTIALS: "Invalid user credentials",
      UNAUTHORIZED: "User is unauthorized to perform this action",
    } satisfies IUserErrors,
    api: {
      UNAUTHORIZED: "You must be authenticated to access this resource",
      METHOD_NOT_ALLOWED: "The requested method is not allowed",
      NOT_IMPLEMENTED: "Not implemented",
    } satisfies IApiErrors,
    general: {
      INTERNAL_SERVER_ERROR: "Internal server error occurred",
      BAD_REQUEST:
        "The request could not be understood or was missing required parameters",
    } satisfies IGeneralErrors,
  },
  app: {
    user: {
      NOT_FOUND: "Your information could not be found",
      INVALID_CREDENTIALS: "The provided credentials are invalid",
      UNAUTHORIZED: "You are not authorized to perform this action",
      STATUS_REJECTED:
        "You cannot access the application. Please follow up with your administrator for more information.",
    } satisfies IUserErrors,
    general: {
      INTERNAL_SERVER_ERROR: "Something went wrong on our end.",
      BAD_REQUEST: "There was an issue while processing your request.",
      UNABLE_TO_PROCESS:
        "The server is unable to process your request at this time.",
    } satisfies IGeneralErrors,
  },
} as const;

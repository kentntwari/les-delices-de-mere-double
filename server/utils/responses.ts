import { H3Event, H3Error } from "h3";
import {
  type PossibleResponse,
  JsonResponse,
  SilentSuccessResponse,
  SuccessResponse,
  BadRequestResponse,
  ForbiddenResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  UnauthorizedResponse,
} from "~~/mvc/controllers/base";
import { errorMap } from "~~/shared/utils/errorMap";

export function treatResponses(
  _event: H3Event,
  response: PossibleResponse,
  currentFileMetadata?: string,
) {
  logger.info(
    {
      data:
        response instanceof JsonResponse
          ? response.data.data instanceof Array
            ? response.data.data.slice(0, 5) // Log only first 5 items if it's an array
            : response.data.data
          : "message" in response
            ? response.message
            : "",
      ...(currentFileMetadata && { file: currentFileMetadata }),
    },
    `[${response.name}]`,
  );

  if (response instanceof JsonResponse || response instanceof SuccessResponse)
    return response.data;
  if (response instanceof SilentSuccessResponse) return sendNoContent(_event);
  else
    throw createError({
      statusCode: response.status,
      statusMessage: response.message,
    });
}

export function treatErrors(error: unknown, currentFileMetadata?: string) {
  const context = {
    ...(currentFileMetadata && { file: currentFileMetadata }),
  };

  // Handle H3Error first (framework-level errors)
  if (error instanceof H3Error) {
    logger.error(
      {
        err: error,
        statusCode: error.statusCode,
        ...context,
      },
      `[H3 ERROR]: ${error.message}`,
    );
    throw error;
  }

  // Handle custom response classes from BaseController
  if (
    error instanceof BadRequestResponse ||
    error instanceof UnauthorizedResponse ||
    error instanceof ForbiddenResponse ||
    error instanceof NotFoundResponse ||
    error instanceof InternalServerErrorResponse
  ) {
    logger.error(
      {
        statusCode: error.status,
        message: error.message,
        errorContext: error.context,
        ...context,
      },
      `[${error.name}]: ${error.message}`,
    );
    throw createError({
      statusCode: error.status,
      statusMessage: error.message,
    });
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    logger.error(
      {
        err: error.stack,
        message: error.message,
        name: error.name,
        ...context,
      },
      `[ERROR]: ${error.message}`,
    );
  } else {
    // Handle unknown error types (strings, objects, etc.)
    logger.error(
      {
        err: JSON.stringify(error),
        ...context,
      },
      "[UNKNOWN ERROR]: Non-Error object thrown",
    );
  }

  // Default to 500 error response
  throw createError({
    statusCode: 500,
    statusMessage: errorMap.sys.general.INTERNAL_SERVER_ERROR,
  });
}

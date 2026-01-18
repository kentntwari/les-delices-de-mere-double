import { H3Event, H3Error } from "h3";
import {
  type PossibleResponse,
  JsonResponse,
  SilentSuccessResponse,
  SuccessResponse,
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
  if (error instanceof H3Error) {
    logger.error(
      {
        err: error,
        ...(currentFileMetadata && { file: currentFileMetadata }),
      },
      `[H3 ERROR]: ${error.message}`,
    );
    throw error;
  } else {
    // TODO: Must implement pino for logging
    // INFO: This should be interna-purpose only
    logger.error(
      {
        err: error,
        ...(currentFileMetadata && { file: currentFileMetadata }),
      },
      "[INTERNAL SERVER ERROR]: An unexpected error occurred",
    );
    throw createError({
      statusCode: 500,
      statusMessage: errorMap.sys.general.INTERNAL_SERVER_ERROR,
    });
  }
}

import { H3Event, H3Error } from "h3";
import {
  type PossibleResponse,
  JsonResponse,
  SilentSuccessResponse,
  SuccessResponse,
} from "~~/mvc/controllers/base";
import { errorMap } from "~~/shared/utils/errorMap";

export function treatResponses(_event: H3Event, response: PossibleResponse) {
  // TODO: Must implement pino for logging
  console.log(
    `[${response.name}]:`,
    response instanceof JsonResponse
      ? response.data
      : "message" in response
      ? response.message
      : ""
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

export function treatErrors(error: unknown) {
  if (error instanceof H3Error) throw error;
  else {
    // TODO: Must implement pino for logging
    // INFO: This should be interna-purpose only
    console.error("[UNEXPECTED ERROR]: ", error);
    throw createError({
      statusCode: 500,
      statusMessage: errorMap.sys.general.INTERNAL_SERVER_ERROR,
    });
  }
}

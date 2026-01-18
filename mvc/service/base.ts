import { ApplicationError, NetworkError } from "../errors.appwide";
import { DatabaseError } from "../errors.db";

export abstract class BaseService {
  protected defaultMapError(error: unknown, source: string) {
    switch (true) {
      case error instanceof DatabaseError:
        throw new ApplicationError(error.message, {
          originalError: error,
          source,
        });

      case error instanceof NetworkError:
        throw error;

      case error instanceof ApplicationError:
        throw error;

      default:
        throw new ApplicationError("An unexpected error occurred", {
          originalError: error,
          source,
        });
    }
  }
}

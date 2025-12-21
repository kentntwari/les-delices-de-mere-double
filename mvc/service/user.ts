import { CreateUserFactoryError } from "../factories/user";
import { UserRepository } from "../repository/user";
import { ApplicationError, NetworkError } from "../errors.appwide";
import { DatabaseError } from "../errors.db";
import {
  type IFactoryStrategyMap,
  FactoryStrategy,
} from "../factories/strategy";

import { type IMapperStrategyMap, MapperStrategy } from "../mapper/strategy";

export class UserService {
  constructor(
    private repository: UserRepository = new UserRepository(),
    private factory: IFactoryStrategyMap = FactoryStrategy,
    private mapper: IMapperStrategyMap = MapperStrategy
  ) {}

  async readUser(id: string) {
    try {
      const model = await this.repository.getUser(id);

      if (!model) return null;
      return this.mapper.common.toEntity(model);
    } catch (error) {
      this.mapError(error, "service.user.readUser");
      throw error;
    }
  }

  async registerUser(data: unknown) {
    try {
      const entity = this.factory.registerUser.create(data);
      const model = await this.repository.createUser(entity);
      return this.mapper.common.toEntity(model);
    } catch (error) {
      this.mapError(error, "service.user.registerUser");
      throw error;
    }
  }

  mapError(error: unknown, source: string) {
    switch (true) {
      case error instanceof CreateUserFactoryError:
        throw new ApplicationError(error.message, {
          originalError: error,
          source,
        });

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
        throw new ApplicationError("An unknown error occurred", {
          originalError: error,
          source,
        });
    }
  }
}

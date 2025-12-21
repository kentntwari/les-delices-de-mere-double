import { BaseFactory } from "./base";
import {
  createUserSchema,
  type TCreateUserSchema,
} from "../../shared/utils/schemas.zod";
import { UserEntity } from "../entities/user";

export class CreateUserFactory extends BaseFactory<
  TCreateUserSchema,
  UserEntity
> {
  protected build(data: TCreateUserSchema): UserEntity {
    return new UserEntity(
      data.id ?? crypto.randomUUID(),
      data.firstName,
      data.lastName,
      data.email,
      "USER"
    );
  }

  public validate(data: unknown): TCreateUserSchema {
    try {
      const parsedData = createUserSchema.safeParse(data);
      if (parsedData.success) return parsedData.data;

      throw new CreateUserFactoryError("Validation failed", {
        issues: parsedData.error.issues,
        input: data,
        source: "mvc.factories.user.CreateUserFactory.validate",
      });
    } catch (error) {
      if (error instanceof CreateUserFactoryError) throw error;
      else
        throw new CreateUserFactoryError("Failed to create user entity", {
          originalError: error,
          input: data,
          source: "mvc.factories.user.CreateUserFactory.validate",
        });
    }
  }
}

export class CreateUserFactoryError extends Error {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message);
    this.name = "CREATE USER FACTORY ERROR";
    // TODO: Must implement pino for logging
    console.error(`[CreateUserFactoryError]: ${this.message}`, context);
  }
}

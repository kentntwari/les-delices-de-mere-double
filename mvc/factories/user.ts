import { BaseFactory } from "./base";
import {
  userSchema,
  createUserSchema,
  type TUserSchema as TUserDTO,
} from "../../shared/utils/schemas.zod";
import { UserEntity } from "../entities/user";
import { ApplicationError } from "../errors.appwide";

export class UserFactory extends BaseFactory<TUserDTO, UserEntity> {
  protected build(data: Partial<TUserDTO>): UserEntity {
    return new UserEntity(
      data.id ?? crypto.randomUUID(),
      data.firstName || "",
      data.lastName || "",
      data.email || "",
      "USER"
    );
  }

  public validate(data: unknown): TUserDTO {
    try {
      const parsedData = userSchema.safeParse(data);
      if (parsedData.success) return parsedData.data;

      throw new ApplicationError("Validation failed", {
        issues: JSON.stringify(parsedData.error.issues),
        input: JSON.stringify(data),
        source: "mvc.factories.user.UserFactory.validate",
      });
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      else
        throw new ApplicationError(
          "Unknown error occured during validation of user",
          {
            originalError: JSON.stringify(error),
            input: JSON.stringify(data),
            source: "mvc.factories.user.UserFactory.validate",
          }
        );
    }
  }
}

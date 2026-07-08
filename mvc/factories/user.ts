import { BaseFactory } from "./base";
import {
  userSchema,
  createUserSchema,
  type TUserSchema as TUserDTO,
} from "../../shared/utils/schemas.zod";
import { UserEntity } from "../entities/user";
import { ApplicationError } from "../errors.appwide";

const deconstructedFullNameSchema = userSchema.pick({
  firstName: true,
  lastName: true,
});

export class UserFactory extends BaseFactory<TUserDTO, UserEntity> {
  static fromFullName(fullName: string): {
    firstName: string;
    lastName: string;
  } {
    const [firstName, ...lastNameParts] = fullName.split(" ");
    const { data, error, success } = deconstructedFullNameSchema.safeParse({
      firstName,
      lastName: lastNameParts.join(" "),
    });

    if (!data) {
      logger.warn(
        {
          input: fullName,
          error: error.message,
          source: "mvc.factories.user.UserFactory.fromFullName",
        },
        "[USER FACTORY] Failed to parse full name into first and last name",
      );

      return {
        firstName: "",
        lastName: "",
      };
    }

    return data;
  }

  public build(data: Partial<TUserDTO>): UserEntity {
    return new UserEntity(
      data.id ?? crypto.randomUUID(),
      data.firstName || "",
      data.lastName || "",
      data.email || "",
      "USER",
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
          },
        );
    }
  }
}

import type { User as UserModel } from "@prisma/client";
import { BaseMapper } from "./base";
import { UserEntity } from "../entities/user";
import { TCreateUserSchema } from "../../shared/utils/schemas.zod";
import { UserWebhookEvent } from "@clerk/backend/webhooks";

export class UserMapper extends BaseMapper<UserEntity, UserModel> {
  toEntity(data: UserModel): UserEntity {
    const [firstName, ...lastNameParts] = data.name.split(" ");
    return new UserEntity(
      data.id,
      firstName || "",
      lastNameParts.join(" ") || "",
      data.email,
      data.role,
      data.permissions
    );
  }

  toSafeModel(entity: UserEntity) {
    return {
      id: entity.id,
      name: entity.fullName,
      email: entity.email,
      role: entity.role,
    } satisfies Partial<UserModel>;
  }
}

type TCreateUserDTO = TCreateUserSchema;
export class CreateUserMapper extends UserMapper {
  fromClerkWebhookEvent(event: UserWebhookEvent): TCreateUserDTO {
    return {
      id: event.data.id,
      firstName:
        event.type === "user.deleted"
          ? "UNSPECIFED_FIRST_NAME"
          : event.data.first_name ?? "UNSPECIFED_FIRST_NAME",
      lastName:
        event.type === "user.deleted"
          ? "UNSPECIFED_LAST_NAME"
          : event.data.last_name ?? "UNSPECIFED_LAST_NAME",
      email:
        event.type === "user.deleted"
          ? "UNSPECIFED_EMAIL@DOMAIN.COM"
          : event.data.email_addresses[0]?.email_address ??
            "UNSPECIFED_EMAIL@DOMAIN.COM",
      permissions: [],
    };
  }
  toDto(entity: UserEntity): TCreateUserDTO {
    return {
      id: entity.id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email,
      permissions: entity.grantBasicUserAccess(),
    } satisfies TCreateUserSchema;
  }
}

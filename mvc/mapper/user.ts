import type { User as UserModel } from "@prisma/client";
import type { UserJSON } from "@clerk/nuxt/server";
import type {
  TUserSchema as TUserDTO,
  TCreateUserSchema as TCreateUserDTO,
} from "../../shared/utils/schemas.zod";

import { BaseMapper } from "./base";
import { UserEntity } from "../entities/user";

export class UserMapper extends BaseMapper<UserEntity, TUserDTO, UserModel> {
  toEntity(data: UserModel): UserEntity {
    const [firstName, ...lastNameParts] = data.name.split(" ");
    const e = new UserEntity(
      data.id,
      firstName || "",
      lastNameParts.join(" ") || "",
      data.email,
      data.role
    );

    e.permissions = data.permissions;
    e.status = data.status;

    return e;
  }

  toDto(entity: UserEntity) {
    return {
      id: entity.id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email,
      role: entity.role,
    };
  }

  toSafeModel(entity: UserEntity) {
    return {
      id: entity.id,
      name: entity.fullName,
      email: entity.email,
      role: entity.role,
    };
  }
}

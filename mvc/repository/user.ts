import type { User as UserModel, PrismaClient } from "@prisma/client";

import { UserEntity } from "../entities/user";

import { DatabaseError } from "../errors.db";

import { db as defaultDbClient } from "../../server/utils/db";

export const RepositoryFailuresMessages = {
  getUser: "Failed to get user from database",
  createUser: "Failed to create user in database",
} as const;

interface IUserRepository {
  getUser(id: string): Promise<UserModel | null>;
  createUser(entity: UserEntity): Promise<UserModel>;
}

// TODO: Make repository generic to allow any client in the future
export class UserRepository implements IUserRepository {
  constructor(private db: PrismaClient = defaultDbClient) {}

  async getUser(id: string): Promise<UserModel | null> {
    try {
      return await this.db.user.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.getUser, {
        operation: "getUser",
        userId: id,
        error,
      });
    }
  }

  // TODO: Method for admins to safely add new users (.ie. whitelisting)
  // FIX: Must be able to check if user was whitelisted by admin
  async createUser(entity: UserEntity) {
    try {
      return await this.db.user.create({
        data: {
          id: entity.id,
          email: entity.email,
          name: entity.fullName,
          permissions: entity.grantBasicUserAccess(),
        },
      });
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.createUser, {
        operation: "createUser",
        error,
      });
    }
  }
}

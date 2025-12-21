import type { User as UserModel } from "@prisma/client";

export interface IUserMeta {
  status: UserModel["status"];
  role: UserModel["role"];
}

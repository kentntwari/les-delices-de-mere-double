import type { User as UserModel, $Enums } from "@prisma/client";

export class UserEntity implements Pick<UserModel, "id" | "email" | "role"> {
  protected _fullName: string;
  protected _status: UserModel["status"] = "PENDING";

  constructor(
    public readonly id: string,
    public firstName: string,
    public lastName: string,
    public email: string,
    public role: UserModel["role"],
    protected permissions: UserModel["permissions"] = []
  ) {
    this._fullName = `${firstName} ${lastName}`;
  }

  private static _defaultPermissions: UserModel["permissions"] = [
    "READ_ORDERS",
    "READ_CUSTOMERS",
  ];

  private static _superUserPermissions: UserModel["permissions"] = [
    ...UserEntity._defaultPermissions,
    "UPDATE_CUSTOMERS",
    "DELETE_CUSTOMERS",
  ];

  private static _adminPermissions: UserModel["permissions"] = [
    ...UserEntity._superUserPermissions,
    "READ_USERS",
    "UPDATE_USERS",
    "DELETE_USERS",
  ];

  get fullName(): string {
    return this._fullName;
  }

  public get status() {
    return this._status;
  }

  set fullName(newFullName: string) {
    this._fullName = newFullName;
    const [firstName, ...lastNameParts] = newFullName.split(" ");
    this.firstName = firstName || "";
    this.lastName = lastNameParts.join(" ") || "";
  }

  blockUser(): void {
    this._status = "REJECTED";
    this.permissions = [];
  }

  grantBasicUserAccess() {
    this._status = "APPROVED";
    this.permissions = UserEntity._defaultPermissions;
    return this.permissions;
  }

  grantFullCustomerAccess() {
    if (this.role === "USER")
      this.permissions.push("DELETE_CUSTOMERS", "UPDATE_CUSTOMERS");
    this.permissions = Array.from(new Set(this.permissions));
    return this.permissions;
  }

  grantFullOrderAccess() {
    this.permissions.push("DELETE_ORDERS", "UPDATE_ORDERS");
    this.permissions = Array.from(new Set(this.permissions));
    return this.permissions;
  }

  grantFullMenuAccess() {
    if (this.role !== "USER")
      this.permissions.push("READ_MENU", "UPDATE_MENU", "DELETE_MENU");
    this.permissions = Array.from(new Set(this.permissions));
    return this.permissions;
  }

  grantFullUserAccess() {
    if (this.role === "ADMIN")
      this.permissions.push("READ_USERS", "UPDATE_USERS", "DELETE_USERS");
    this.permissions = Array.from(new Set(this.permissions));
    return this.permissions;
  }

  assignRole(role: UserEntity["role"]): void {
    this.role = role;

    switch (true) {
      case role === "SUPERUSER":
        this.permissions = UserEntity._superUserPermissions;
        break;

      case role === "ADMIN":
        this.permissions = UserEntity._adminPermissions;
        break;

      default:
        this.permissions = UserEntity._defaultPermissions;
        break;
    }
  }
}

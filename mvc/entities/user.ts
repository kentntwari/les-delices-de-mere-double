import type { User as UserModel, $Enums } from "@prisma/client";

export class UserEntity implements Pick<UserModel, "id" | "email" | "role"> {
  private _fullName: string;
  private _status: UserModel["status"] = "PENDING";
  private _permissions: UserModel["permissions"] = [];

  constructor(
    public readonly id: string,
    public firstName: string,
    public lastName: string,
    public email: string,
    public role: UserModel["role"]
  ) {
    this._fullName = `${firstName} ${lastName}`;
    this._permissions = UserEntity._defaultPermissions;
  }

  private static _defaultPermissions: UserModel["permissions"] = [
    "READ_MENU",
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

  public set status(newStatus: $Enums.WhitelistStatus) {
    this._status = newStatus;
  }

  public get permissions() {
    return this._permissions;
  }

  public set permissions(newPermissions: UserModel["permissions"]) {
    this._permissions = newPermissions;
  }

  set fullName(newFullName: string) {
    this._fullName = newFullName;
    const [firstName, ...lastNameParts] = newFullName.split(" ");
    this.firstName = firstName || "";
    this.lastName = lastNameParts.join(" ") || "";
  }

  blockUser(): void {
    this._status = "REJECTED";
    this._permissions = [];
  }

  grantBasicUserAccess() {
    this._status = "APPROVED";
    this._permissions = UserEntity._defaultPermissions;
    return this._permissions;
  }

  grantFullCustomerAccess() {
    if (this.role === "USER")
      this._permissions.push("DELETE_CUSTOMERS", "UPDATE_CUSTOMERS");
    this._permissions = Array.from(new Set(this._permissions));
    return this._permissions;
  }

  grantFullOrderAccess() {
    this._permissions.push("DELETE_ORDERS", "UPDATE_ORDERS");
    this._permissions = Array.from(new Set(this._permissions));
    return this._permissions;
  }

  grantFullMenuAccess() {
    if (this.role !== "USER")
      this._permissions.push("READ_MENU", "UPDATE_MENU", "DELETE_MENU");
    this._permissions = Array.from(new Set(this._permissions));
    return this._permissions;
  }

  grantFullUserAccess() {
    if (this.role === "ADMIN")
      this._permissions.push("READ_USERS", "UPDATE_USERS", "DELETE_USERS");
    this._permissions = Array.from(new Set(this._permissions));
    return this._permissions;
  }

  assignRole(role: UserEntity["role"]): void {
    this.role = role;

    switch (true) {
      case role === "SUPERUSER":
        this._permissions = UserEntity._superUserPermissions;
        break;

      case role === "ADMIN":
        this._permissions = UserEntity._adminPermissions;
        break;

      default:
        this._permissions = UserEntity._defaultPermissions;
        break;
    }
  }
}

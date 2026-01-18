import type { $Enums } from "@prisma/client";
import { UserEntity } from "../entities/user";

export abstract class BasePolicy<TResource = unknown> {
  constructor(protected readonly user: UserEntity) {}

  abstract canView(): boolean;
  abstract canEdit(): boolean;
  abstract canDelete(): boolean;

  protected hasRole(role: $Enums.Role) {
    return this.user.role === role;
  }

  protected hasAnyRole(...roles: $Enums.Role[]): boolean {
    return roles.includes(this.user.role);
  }

  protected hasPermission(permission: $Enums.Permissions): boolean {
    return this.user.permissions.includes(permission);
  }

  protected hasAllPermissions(...permissions: $Enums.Permissions[]): boolean {
    return permissions.every((p) => this.user.permissions.includes(p));
  }

  protected hasAnyPermission(...permissions: $Enums.Permissions[]): boolean {
    return permissions.some((p) => this.user.permissions.includes(p));
  }

  protected isStatusPending() {
    return this.user.status === "PENDING";
  }

  protected isUser() {
    return this.user.role === "USER";
  }

  protected isAdmin() {
    return this.user.role === "ADMIN";
  }

  protected isSuperuser(): boolean {
    return this.user.role === "SUPERUSER";
  }

  protected isBlocked() {
    return this.user.permissions.length === 0;
  }
}

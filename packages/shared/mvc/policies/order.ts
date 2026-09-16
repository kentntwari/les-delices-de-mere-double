import type { OrderEntity } from "../entities/order";

import { BasePolicy } from "./base";

export class OrderPolicy extends BasePolicy<OrderEntity> {
  canView(): boolean {
    if (this.isBlocked()) return false;
    if (this.isAdmin()) return true;
    if (this.isSuperuser()) return true;
    return this.hasPermission("READ_ORDERS");
  }

  canEdit(): boolean {
    if (this.isBlocked()) return false;
    if (this.isAdmin()) return true;
    if (this.isSuperuser()) return true;
    if (this.isUser() && !this.isStatusPending()) return true;
    return this.hasPermission("UPDATE_CUSTOMERS");
  }

  canDelete(): boolean {
    if (this.isBlocked()) return false;
    if (this.isAdmin()) return true;
    if (this.isSuperuser()) return true;
    return this.hasPermission("DELETE_ORDERS");
  }
}

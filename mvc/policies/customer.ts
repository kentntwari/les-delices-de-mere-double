import { BasePolicy } from "./base";
import { CustomerEntity } from "../entities/customer";

export class CustomerPolicy extends BasePolicy<CustomerEntity> {
  canView(): boolean {
    if (super.isBlocked()) return false;
    if (super.isAdmin()) return true;
    if (super.isSuperuser()) return true;
    return super.hasPermission("READ_CUSTOMERS");
  }

  canEdit(): boolean {
    if (super.isBlocked()) return false;
    if (super.isAdmin()) return true;
    if (super.isSuperuser()) return true;
    return super.hasPermission("UPDATE_CUSTOMERS");
  }

  canDelete(): boolean {
    if (super.isBlocked()) return false;
    if (super.isAdmin()) return true;
    if (super.isSuperuser()) return true;
    return super.hasPermission("DELETE_CUSTOMERS");
  }
}

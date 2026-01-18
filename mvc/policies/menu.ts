import { BasePolicy } from "../policies/base";
import { MenuItemEntity } from "../entities/item";

export class MenuPolicy extends BasePolicy<MenuItemEntity> {
  canView(): boolean {
    if (super.isBlocked()) return false;
    if (super.isAdmin()) return true;
    if (super.isSuperuser()) return true;
    return super.hasPermission("READ_MENU");
  }

  canEdit(): boolean {
    if (super.isBlocked()) return false;
    if (super.isAdmin()) return true;
    if (super.isSuperuser()) return true;
    return super.hasPermission("UPDATE_MENU");
  }

  canDelete(): boolean {
    if (super.isBlocked()) return false;
    if (super.isAdmin()) return true;
    if (super.isSuperuser()) return true;
    return super.hasPermission("DELETE_MENU");
  }
}

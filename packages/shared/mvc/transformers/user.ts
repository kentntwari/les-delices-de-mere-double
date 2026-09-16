import type { UserJSON } from "@clerk/backend";
import type { TUserSchema as TUserDTO } from "../../utils/schemas.zod";

export class UserTransformer {
  static fromClerkWebhookEvent(user: UserJSON): TUserDTO {
    return {
      id: user.id,
      firstName: user.first_name ?? "UNSPECIFED_FIRST_NAME",
      lastName: user.last_name ?? "UNSPECIFED_LAST_NAME",
      email:
        user.email_addresses[0]?.email_address ?? "UNSPECIFED_EMAIL@DOMAIN.COM",
    };
  }
}

import { CustomerEntity } from "../entities/customer";
import { CustomerRepository } from "../repository/customer";
import { type TCustomerSchema as TCustomerDTO } from "../../shared/utils/schemas.zod";

export class CustomerTransformer {
  static toCreatePayload(
    cx: TCustomerDTO,
  ): Parameters<CustomerRepository["createCustomer"]>[0] {
    return {
      name: cx.fullName,
      email: cx.email || null,
      phone: CustomerEntity.parsePhone({
        countryCode: cx.phone.countryCode,
        number: cx.phone.number,
      }).toString(),
      whatsappPhoneNumber: CustomerEntity.parsePhone({
        countryCode: cx.whatsappNumber
          ? cx.whatsappNumber.countryCode
          : cx.phone.countryCode,
        number: cx.whatsappNumber ? cx.whatsappNumber.number : cx.phone.number,
      }).toString(),
    };
  }
}

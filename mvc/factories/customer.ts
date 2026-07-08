import { BaseFactory } from "./base";
import { CustomerEntity } from "../entities/customer";
import {
  customerSchema,
  type TCustomerSchema as TCustomerDTO,
} from "../../shared/utils/schemas.zod";
import { ApplicationError } from "../errors.appwide";
import type { TOrderPreviewRepositoryModel } from "~~/shared/types";
import type { CustomerModel } from "../repository/customer";

export class CustomerFactory extends BaseFactory<TCustomerDTO, CustomerEntity> {
  public build(data: TCustomerDTO): CustomerEntity {
    return new CustomerEntity(
      data.id,
      data.fullName,
      data.email || null,
      data.phone,
      data.whatsappNumber || data.phone,
      data.address
        ? {
            street: data.address.street,
            city: data.address.city,
            state: data.address.province,
            postalCode: data.address.postalCode,
            country: data.address.country as "CANADA",
          }
        : undefined,
    );
  }

  public validate(data: unknown): TCustomerDTO {
    try {
      const parsed = customerSchema.safeParse(data);
      if (parsed.success) return parsed.data;
      throw new ApplicationError("Validation failed", {
        issues: parsed.error.issues,
        input: data,
        source: "mvc.factories.customer.CustomerFactory.validate",
      });
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      else
        throw new ApplicationError(
          "Unknown error occured during validation of customer",
          {
            originalError: JSON.stringify(error),
            input: JSON.stringify(data),
            source: "mvc.factories.customer.CustomerFactory.validate",
          },
        );
    }
  }

  static fromOrderPreview(model: TOrderPreviewRepositoryModel): CustomerModel {
    return {
      id: model.customer?.id || "UNKNOWN_CUSTOMER_ID",
      name: model.customer?.name || "UNKNOWN_CUSTOMER_NAME",
      email: null,
      // Preview queries only load lightweight customer data, so use a valid
      // fallback number that survives entity/DTO normalization.
      phone: "+10000000000",
      whatsappPhoneNumber: "+10000000000",
      homeAddressId: null,
    };
  }
}

import type { CustomerModel } from "../repository/customer";
import type { TCustomerSchema as TCustomerDTO } from "../../shared/utils/schemas.zod";

import { BaseMapper } from "./base";
import { CustomerEntity } from "../entities/customer";

export type TCustomerFullDTO = Required<
  Omit<TCustomerDTO, "address"> & {
    address: TCustomerDTO["address"] | null;
  }
>;
export class CustomerMapper extends BaseMapper<
  CustomerEntity,
  TCustomerDTO,
  CustomerModel
> {
  toEntity(data: CustomerModel) {
    return new CustomerEntity(
      data.id,
      data.name,
      data.email,
      data.phone,
      data.whatsappPhoneNumber || data.phone,
    );
  }

  toEntityList(data: CustomerModel[]) {
    return data.map((item) => this.toEntity(item));
  }

  toSafeModel(entity: CustomerEntity): Partial<CustomerModel> {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      phone: entity.fullPhoneNumber,
    };
  }

  toDto(entity: CustomerEntity): TCustomerDTO {
    return {
      id: entity.id,
      fullName: entity.name,
      email: entity.email ?? undefined,
      phone: CustomerEntity.parsePhone(entity.phone),
      whatsappNumber: CustomerEntity.parsePhone(entity.whatsappPhoneNumber),
    };
  }

  toFullDto(entity: CustomerEntity): TCustomerFullDTO {
    return {
      id: entity.id,
      fullName: entity.name,
      email: entity.email ?? "",
      phone: CustomerEntity.parsePhone(entity.phone),
      whatsappNumber: CustomerEntity.parsePhone(entity.whatsappPhoneNumber),
      address: entity.address
        ? {
            street: entity.address.street,
            city: entity.address.city,
            province: entity.address.state,
            postalCode: entity.address.postalCode,
            country: "Canada",
          }
        : null,
    };
  }

  toDtoList(entities: CustomerEntity[]): TCustomerDTO[] {
    return entities.map((entity) => this.toDto(entity));
  }
}

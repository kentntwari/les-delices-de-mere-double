import { BaseService } from "./base";

import { CustomerRepository } from "../repository/customer";

import { CustomerMapper } from "../mapper/customer";
import { CustomerFactory } from "../factories/customer";
import { CustomerEntity } from "../entities/customer";
import { CustomerTransformer } from "../transformers/customer";

import { type TCustomerSchema as TCustomerDTO } from "../../shared/utils/schemas.zod";

export class CustomerService extends BaseService {
  constructor(
    private repository: CustomerRepository = new CustomerRepository(),
    private factory: CustomerFactory = new CustomerFactory(),
    private mapper: CustomerMapper = new CustomerMapper(),
  ) {
    super();
  }
  async listCustomers() {
    try {
      const customers = await this.repository.getCustomers();
      return this.mapper.toEntityList(customers);
    } catch (error) {
      this.defaultMapError(error, "service.customer.listCustomers");
      throw error;
    }
  }

  async createCustomer(data: unknown) {
    try {
      const validated = this.factory.validate(data);
      const customer = await this.repository.createCustomer(
        CustomerTransformer.toCreatePayload(validated),
      );
      return this.mapper.toEntity(customer);
    } catch (error) {
      this.defaultMapError(error, "service.customer.createCustomer");
      throw error;
    }
  }

  async getOrCreateCustomer(cx: Partial<TCustomerDTO>) {
    try {
      const isExistingCustomer =
        cx.id && cx.id.trim() !== "" && cx.id !== "NEW_CUSTOMER";

      const res = isExistingCustomer
        ? await this.repository.getCustomer(cx.id!)
        : await this.createCustomer(cx);

      return res instanceof CustomerEntity
        ? res
        : !res
          ? null
          : this.mapper.toEntity(res);
    } catch (error) {
      this.defaultMapError(error, "service.customer.getOrCreateCustomer");
      throw error;
    }
  }
}

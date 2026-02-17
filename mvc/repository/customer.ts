import { Prisma } from "@prisma/client";

import { db as dbClient } from "../../server/utils/db";
import { DatabaseError } from "../errors.db";

export type CustomerModel = Prisma.CustomerGetPayload<{
  omit: {
    createdAt: true;
    updatedAt: true;
    street: true;
    city: true;
    state: true;
    postalCode: true;
    country: true;
  };
}>;

export const RepositoryFailuresMessages = {
  getCustomers: "Failed to get customers from database",
  getCustomer: "Failed to get customer from database",
  createCustomer: "Failed to create customer in database",
} as const;

type TCreateCustomerParam = Prisma.CustomerGetPayload<{
  select: { name: true; email: true; phone: true; whatsappPhoneNumber: true };
}> & {
  address?: Prisma.CustomerGetPayload<{
    select: {
      street: true;
      city: true;
      state: true;
      postalCode: true;
      country: true;
    };
  }>;
};
interface ICustomerRepository {
  getCustomers(): Promise<CustomerModel[]>;
  getCustomer(id: string): Promise<CustomerModel | null>;
  createCustomer(data: TCreateCustomerParam): Promise<CustomerModel>;
  // updateCustomer(
  //   data: Partial<Omit<CustomerModel, "id">>,
  // ): Promise<CustomerModel>;
}

export class CustomerRepository implements ICustomerRepository {
  constructor(private db = dbClient) {}

  async getCustomers(): ReturnType<ICustomerRepository["getCustomers"]> {
    try {
      return await this.db.customer.findMany();
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.getCustomers, {
        operation: "getCustomers",
        error,
      });
    }
  }

  async getCustomer(
    id: string,
  ): ReturnType<ICustomerRepository["getCustomer"]> {
    try {
      return await this.db.customer.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.getCustomer, {
        operation: "getCustomer",
        customerId: id,
        error,
      });
    }
  }

  async createCustomer(
    data: TCreateCustomerParam,
  ): ReturnType<ICustomerRepository["createCustomer"]> {
    try {
      return await this.db.customer.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          whatsappPhoneNumber: data.whatsappPhoneNumber,
          street: data.address?.street || null,
          city: data.address?.city || null,
          state: data.address?.state || null,
          postalCode: data.address?.postalCode || null,
        },
      });
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.createCustomer, {
        operation: "createCustomer",
        customerData: data,
        error,
      });
    }
  }
}

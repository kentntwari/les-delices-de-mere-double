import { Prisma, PrismaClient } from "@prisma/client";

import { db as dbClient } from "../../server/utils/db";
import { DatabaseError } from "../errors.db";
import { DeliveryRepository, type DeliveryAddressModel } from "./delivery";

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
  updateCustomerAddress: "Failed to update customer address in database",
} as const;

type TCreateCustomerParam = { id?: string } & Prisma.CustomerGetPayload<{
  select: { name: true; email: true; phone: true; whatsappPhoneNumber: true };
}> & {
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
export interface ICustomerRepository {
  getCustomers(): Promise<CustomerModel[]>;
  getCustomer(id: string): Promise<CustomerModel | null>;
  createCustomer(data: TCreateCustomerParam): Promise<CustomerModel>;
  updateCustomerAddress(
    customerId: string,
    data: NonNullable<TCreateCustomerParam["address"]>,
  ): Promise<CustomerModel>;
  // updateCustomer(
  //   data: Partial<Omit<CustomerModel, "id">>,
  // ): Promise<CustomerModel>;
}

export class CustomerRepository implements ICustomerRepository {
  constructor(
    private db: PrismaClient | Prisma.TransactionClient = dbClient,
    private deliveryRepository: DeliveryRepository = new DeliveryRepository(db),
  ) {}

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
          ...(data.address && {
            homeAddress: {
              create: {
                street: data.address.street,
                city: data.address.city,
                state: data.address.state,
                postalCode: data.address.postalCode,
                country: data.address.country,
              },
            },
          }),
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

  async updateCustomerAddress(
    customerId: string,
    data: NonNullable<TCreateCustomerParam["address"]>,
  ) {
    try {
      return await this.db.customer.update({
        where: { id: customerId },
        data: {
          homeAddress: {
            create: {
              street: data.street,
              city: data.city,
              state: data.state,
              postalCode: data.postalCode,
              country: data.country,
            },
          },
        },
      });
    } catch (error) {
      throw new DatabaseError(
        RepositoryFailuresMessages.updateCustomerAddress,
        {
          operation: "updateCustomerAddress",
          customerId,
          addressData: data,
          error,
        },
      );
    }
  }
}

import { type Customer as CustomerModel } from "@prisma/client";

interface ICustomerAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string & "CANADA";
}
export class CustomerEntity
  implements Pick<CustomerModel, "id" | "name" | "email">
{
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public address?: ICustomerAddress,
    public phone?: string
  ) {}
}

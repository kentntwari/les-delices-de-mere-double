import type { CustomerModel } from "../repository/customer";
import {
  type TCustomerSchema,
  phoneNumberSchema,
} from "../../shared/utils/schemas.zod";

interface ICustomerAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: "CANADA";
}

class PhoneNumber {
  private constructor(
    public readonly countryCode: string,
    public readonly number: string,
  ) {}

  static create(input: TCustomerSchema["phone"]): PhoneNumber {
    const parsed = phoneNumberSchema.parse(input);
    return new PhoneNumber(parsed.countryCode, parsed.number);
  }

  static fromFullNumber(full: string): PhoneNumber {
    const match = full.match(/^\+?(\d{1,3})(\d{7,15})$/);
    if (!match) {
      throw new Error(`Invalid phone number format: ${full}`);
    }

    return new PhoneNumber(match[1]!, match[2]!);
  }

  toString(): string {
    return `+${this.countryCode}${this.number}`;
  }

  equals(other: PhoneNumber): boolean {
    return (
      this.countryCode === other.countryCode && this.number === other.number
    );
  }
}
export class CustomerEntity implements Pick<
  CustomerModel,
  "id" | "name" | "email"
> {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string | null,
    public phone: TCustomerSchema["phone"] | string,
    public whatsappPhoneNumber: TCustomerSchema["phone"] | string,
    public address?: ICustomerAddress,
  ) {}

  static parsePhone(input: TCustomerSchema["phone"] | string): PhoneNumber {
    return typeof input === "string"
      ? PhoneNumber.fromFullNumber(input)
      : PhoneNumber.create(input);
  }

  get fullPhoneNumber(): string {
    const phone = CustomerEntity.parsePhone(this.phone);
    return phone.toString();
  }

  get fullWhatsappNumber(): string {
    const phone = CustomerEntity.parsePhone(this.whatsappPhoneNumber);
    return phone.toString();
  }

  get hasSameNumberAsWhatsapp(): boolean {
    const phone = CustomerEntity.parsePhone(this.phone);
    const whatsapp = CustomerEntity.parsePhone(this.whatsappPhoneNumber);
    return phone.equals(whatsapp);
  }
}

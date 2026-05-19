import { Prisma, PrismaClient } from "@prisma/client";
import { db as dbClient } from "../../server/utils/db";
import { type IBaseRepository } from "./base";
import { DatabaseError } from "../errors.db";
import { DeliveryMapper } from "../mapper/delivery";

export type DeliveryAddressModel = Prisma.DeliveryAddressGetPayload<{
  omit: {
    createdAt: true;
    updatedAt: true;
  };
}>;

export type DeliveryModel = {
  address: DeliveryAddressModel;
  fees: { total: number } | undefined;
  _meta: {
    order:
      | {
          id: string;
          isPaid: boolean;
          orderDeliveryId: string;
        }
      | undefined;
    customer:
      | {
          id: string;
          homeAddress: DeliveryAddressModel | null;
        }
      | undefined;
  };
};

export type OrderDeliveryAddressModel = Prisma.OrderDeliveryAddressGetPayload<{
  select: {
    id: true;
    deliveryAddress: {
      omit: {
        createdAt: true;
        updatedAt: true;
      };
    };
    order: {
      select: {
        id: true;
        deliveryFee: true;
        paymentStatus: true;
        customer: {
          select: {
            id: true;
            homeAddress: true;
          };
        };
      };
    };
  };
}>;

export interface IDeliveryRepository extends IBaseRepository<DeliveryModel> {
  getOrderDeliveryDetails(
    orderId: string,
    ...args: any[]
  ): Promise<DeliveryModel | null>;
  confirmAddressId(
    id: string,
  ): Promise<{ valid: boolean; address: DeliveryAddressModel | null }>;
  confirmAddressInfo(
    street: string,
    city: string,
    province: string,
    postalCode: string,
    country: string,
  ): Promise<{ valid: boolean; address: DeliveryAddressModel | null }>;
  findMatchingCustomers(addressId: string): Promise<{
    matchingCustomers: string[];
    address: DeliveryAddressModel;
  } | null>;
}

export const RepositoryFailuresMessages = {
  get: "Failed to get delivery address from database",
  getAll: "Failed to get all delivery addresses from database",
  create: "Failed to create delivery address in database",
  update: "Failed to update delivery address in database",
  delete: "Failed to delete delivery address from database",
  getOrderDeliveryDetails:
    "Failed to get delivery details for order from database",
  confirmAddressId: "Failed to confirm delivery address by ID from database",
  confirmAddressInfo:
    "Failed to confirm delivery address by full address from database",
  findMatchingCustomers:
    "Failed to find matching customers by address from database",
} as const satisfies Record<keyof IDeliveryRepository, string>;

interface IDeliveryMetadata {
  addressId?: string;
  addressInfo?: Omit<DeliveryAddressModel, "id">;
}

export class DeliveryRepository implements IDeliveryRepository {
  private matchingCustomersAtAddress: string[] = [];

  private IS_CUSTOMER_HOME_ADDRESS_MATCHING_DELIVERY_ADDRESS: boolean = false;

  constructor(
    private db: PrismaClient | Prisma.TransactionClient = dbClient,
    public meta?: IDeliveryMetadata & { orderId?: string; customerId?: string },
    private mapper: DeliveryMapper = new DeliveryMapper(),
  ) {}

  /**
   * Factory method for creating a fully initialized DeliveryRepository.
   */
  static async create(
    db: PrismaClient | Prisma.TransactionClient = dbClient,
    meta?: IDeliveryMetadata & { customerId?: string },
  ): Promise<DeliveryRepository> {
    const repo = new DeliveryRepository(db, meta);
    await repo.initialize();
    return repo;
  }

  withTransaction(tx: Prisma.TransactionClient): DeliveryRepository {
    this.db = tx;
    return this.meta
      ? new DeliveryRepository(tx, this.meta)
      : new DeliveryRepository(tx);
  }

  private async initialize(): Promise<void> {
    if (typeof this.meta?.addressId === "string") {
      await this.findMatchingCustomers(this.meta.addressId);
    } else if (this.meta?.addressInfo) {
      const result = await this.confirmAddressInfo(
        this.meta.addressInfo.street || "",
        this.meta.addressInfo.city || "",
        this.meta.addressInfo.state || "",
        this.meta.addressInfo.postalCode || "",
        this.meta.addressInfo.country || "",
      );

      if (result && result.address)
        await this.findMatchingCustomers(result.address.id);
    }

    if (
      this.matchingCustomersAtAddress.some((c) => c === this.meta?.customerId)
    )
      this.matchesCustomerHomeAddress = true;
  }

  get matchesCustomerHomeAddress(): boolean {
    return this.IS_CUSTOMER_HOME_ADDRESS_MATCHING_DELIVERY_ADDRESS;
  }

  set matchesCustomerHomeAddress(value: boolean) {
    this.IS_CUSTOMER_HOME_ADDRESS_MATCHING_DELIVERY_ADDRESS = value;
  }

  async get(id: string): Promise<DeliveryModel | null> {
    try {
      const [ad, ed] = await Promise.all([
        this.db.deliveryAddress.findUnique({
          where: { id },
          omit: { createdAt: true, updatedAt: true },
        }),
        !this.meta?.orderId
          ? null
          : this.db.orderDeliveryAddress.findFirst({
              where: { orderId: this.meta.orderId, deliveryAddressId: id },
              select: {
                id: true,
                order: {
                  select: {
                    id: true,
                    deliveryFee: true,
                    customer: {
                      select: {
                        id: true,
                        homeAddress: true,
                      },
                    },
                    paymentStatus: true,
                  },
                },
              },
            }),
      ]);

      if (!ad) return null;

      if (!ad && !ed) return null;

      if ((ad && !ed) || (ad && !ed?.order))
        return {
          address: ad,
          fees: undefined,
          _meta: { order: undefined, customer: undefined },
        };

      return this.mapper.fromOrderDelivery({
        ...ed!,
        deliveryAddress: ad,
      });
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.get, {
        operation: "get",
        error,
        addressId: id,
        orderId: this.meta?.orderId,
        customerId: this.meta?.customerId,
      });
    }
  }

  async getAll(): Promise<DeliveryModel[]> {
    try {
      const r = await this.db.orderDeliveryAddress.findMany({
        include: {
          deliveryAddress: true,
          order: {
            select: {
              id: true,
              deliveryFee: true,
              paymentStatus: true,
              customer: {
                select: {
                  id: true,
                  homeAddress: true,
                },
              },
            },
          },
        },
      });

      if (!r) return [];

      return r
        .filter((entry) => entry.deliveryAddress !== null)
        .map((entry) => this.mapper.fromOrderDelivery(entry));
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.getAll, {
        operation: "getAll",
        error,
      });
    }
  }

  async create(data: Omit<DeliveryAddressModel, "id">): Promise<DeliveryModel> {
    try {
      const c = await this.db.deliveryAddress.create({
        data: {
          street: data.street,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          // country: data.country.toUpperCase(),
        },
      });

      return this.mapper.fromDeliveryAddress(c);
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.create, {
        operation: "create",
        error,
        addressData: data,
      });
    }
  }

  async update(
    id: string,
    data: Partial<Omit<DeliveryAddressModel, "id">>,
  ): Promise<Omit<this, "update">> {
    try {
      await this.db.deliveryAddress.update({
        where: { id },
        data: {
          street: data.street,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
        },
      });
      return this;
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.update, {
        operation: "update",
        error,
        addressId: id,
        addressData: data,
      });
    }
  }

  async delete(id: string) {
    try {
      await this.db.deliveryAddress.delete({
        where: { id },
      });
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.delete, {
        operation: "delete",
        error,
        addressId: id,
      });
    }
  }

  async getOrderDeliveryDetails(
    orderId: string,
  ): Promise<DeliveryModel | null> {
    try {
      const b = await this.db.orderDeliveryAddress.findFirst({
        where: {
          orderId,
        },
        select: {
          id: true,
          deliveryAddress: {
            omit: {
              createdAt: true,
              updatedAt: true,
            },
          },
          order: {
            select: {
              id: true,
              paymentStatus: true,
              deliveryFee: true,
              customer: {
                select: {
                  id: true,
                  homeAddress: true,
                },
              },
            },
          },
        },
      });

      if (!b) return null;

      if (!b.deliveryAddress) return null;

      return this.mapper.fromOrderDelivery(b);
    } catch (error) {
      throw new DatabaseError(
        RepositoryFailuresMessages.getOrderDeliveryDetails,
        {
          operation: "getOrderDeliveryDetails",
          error,
          orderId,
        },
      );
    }
  }

  private async _assignAddressToOrder(
    orderId: string,
    addressId: string | undefined,
    addressInfo: IDeliveryMetadata["addressInfo"] | undefined,
  ) {
    if (!addressId && !addressInfo)
      throw new DatabaseError("Failed to assign address to order in database", {
        operation: "_assignAddressToOrder",
        error:
          "Expected meta with either addressId or addressInfo to be defined for order delivery assignment, but received neither.",
        orderId,
        addressId,
        addressInfo,
      });

    const deliveryDetails = await this.db.orderDeliveryAddress.findFirst({
      where: { orderId },
      select: {
        id: true,
      },
    });

    if (!deliveryDetails)
      throw new DatabaseError(
        RepositoryFailuresMessages.getOrderDeliveryDetails,
        {
          operation: "_assignAddressToOrder",
          error:
            "Failed to retrieve order delivery details for order during address assignment to order. Order may not exist or may not have delivery details.",
          orderId,
        },
      );

    if (addressId)
      return this.db.orderDeliveryAddress.update({
        where: { id: deliveryDetails.id },
        data: {
          deliveryAddress: {
            connect: {
              id: addressId,
            },
          },
        },
        select: {
          deliveryAddressId: true,
        },
      });

    if (addressInfo)
      return this.db.orderDeliveryAddress.update({
        where: { id: deliveryDetails.id },
        data: {
          deliveryAddress: {
            create: {
              street: addressInfo!.street,
              city: addressInfo!.city,
              state: addressInfo!.state,
              postalCode: addressInfo!.postalCode,
              country: addressInfo!.country,
            },
          },
        },
        select: {
          deliveryAddressId: true,
        },
      });
    else
      throw new DatabaseError("Failed to assign address to order in database", {
        operation: "_assignAddressToOrder",
        error:
          "Neither addressId nor addressInfo provided for address assignment to order could be confirmed as valid. Address assignment failed.",
        orderId,
        addressId,
        addressInfo,
      });
  }

  async assignAddressToOrder(
    orderId: string,
    addressId: string | undefined,
    addressInfo: IDeliveryMetadata["addressInfo"] | undefined,
  ): Promise<DeliveryModel> {
    try {
      await this._assignAddressToOrder(orderId, addressId, addressInfo);

      const o = await this.getOrderDeliveryDetails(orderId);

      if (!o)
        throw new DatabaseError(
          "Failed to retrieve order delivery details after assignment.",
          {
            operation: "assignAddressToOrder",
            error:
              "Failed to retrieve order delivery details after assignment.",
            orderId,
          },
        );

      return o;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError("Failed to assign address to order in database", {
        operation: "assignAddressToOrder",
        error,
        orderId,
        addressId,
        addressInfo,
      });
    }
  }

  async assignMetaToOrder(orderId: string): Promise<DeliveryModel> {
    try {
      return await this.assignAddressToOrder(
        orderId,
        this.meta?.addressId,
        this.meta?.addressInfo,
      );
    } catch (error) {
      throw new DatabaseError(
        "Failed to assign metadata to order in database",
        {
          operation: "assignMetaToOrder",
          error,
          orderId,
        },
      );
    }
  }

  private async _assignDeliveryToCustomer(
    deliveryId: string | undefined,
    customerId: string,
  ) {
    if (!deliveryId)
      throw new DatabaseError(
        "Failed to assign delivery to customer in database: Missing deliveryId",
        {
          operation: "assignDeliveryToCustomer",
          error: "Missing deliveryId for delivery assignment to customer",
          deliveryId,
          customerId,
        },
      );

    await this.db.orderDeliveryAddress.update({
      where: { id: deliveryId },
      data: {
        deliveryAddress: {
          update: {
            customers: {
              connect: { id: customerId },
            },
          },
        },
      },
    });
  }

  /*

    * Method to assign existing order delivery to customer. Useful when customer address does not match delivery address
    */
  async assignDeliveryToCustomer(
    deliveryId: string | undefined,
    orderId: string | undefined,
    customerId: string,
  ) {
    try {
      if (!deliveryId && !orderId)
        throw new DatabaseError(
          "Failed to assign delivery to customer in database: Missing both deliveryId and orderId",
          {
            operation: "assignDeliveryToCustomer",
            error: new Error("Both deliveryId and orderId are missing"),
            deliveryId,
            orderId,
            customerId,
          },
        );

      if (deliveryId)
        await this._assignDeliveryToCustomer(deliveryId, customerId);
      else if (orderId) {
        const deliveryDetails = await this.db.orderDeliveryAddress.findFirst({
          where: { orderId },
          select: {
            id: true,
          },
        });

        if (!deliveryDetails)
          throw new DatabaseError(
            RepositoryFailuresMessages.getOrderDeliveryDetails,
            {
              operation: "assignDeliveryToCustomer",
              error: new Error(
                "Failed to retrieve order delivery details for order during delivery assignment to customer. Order may not exist or may not have delivery details.",
              ),
              orderId,
              customerId,
            },
          );

        await this._assignDeliveryToCustomer(deliveryDetails.id, customerId);
      }
    } catch (error) {
      throw new DatabaseError(
        "Failed to assign delivery to customer in database" +
          (error instanceof DatabaseError ? `: ${error.message}` : ""),
        {
          operation: "assignDeliveryToCustomer",
          error,
          deliveryId,
          customerId,
          orderId,
        },
      );
    }
  }

  async findMatchingCustomers(
    addressId: string,
  ): Promise<
    Awaited<ReturnType<IDeliveryRepository["findMatchingCustomers"]>>
  > {
    let hasFoundMatchingAddress: boolean = false;

    // FIX: Avoid wasteful running of this method if we have already resolved the addressId from confirmAddressInfo or from constructor initialization
    // TODO: Return from stateful result from constructor initialization

    try {
      const d = await this.db.deliveryAddress.findFirst({
        where: { id: addressId },
        omit: { createdAt: true, updatedAt: true },
        include: {
          customers: {
            select: { id: true },
          },
        },
      });

      if (!d) return null;

      hasFoundMatchingAddress = true;

      this.matchingCustomersAtAddress = d.customers.map((c) => c.id);

      return {
        matchingCustomers: this.matchingCustomersAtAddress,
        address: {
          id: addressId,
          street: d?.street || "",
          city: d?.city || "",
          state: d?.state || "",
          postalCode: d?.postalCode || "",
          country: d?.country || "",
        },
      };
    } catch (error) {
      throw new DatabaseError(
        RepositoryFailuresMessages.findMatchingCustomers,
        {
          operation: "findMatchingCustomers",
          error,
          addressId,
          hasFoundMatchingAddress,
        },
      );
    }
  }

  async confirmAddressId(
    id: string,
  ): Promise<{ valid: boolean; address: DeliveryAddressModel | null }> {
    try {
      const r = await this.db.deliveryAddress.findUnique({
        where: { id },
        select: {
          id: true,
          street: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
        },
      });

      if (!r) return { valid: false, address: null };

      return {
        valid: true,
        address: {
          id: r.id,
          street: r.street,
          city: r.city,
          state: r.state,
          postalCode: r.postalCode,
          country: r.country,
        },
      };
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.confirmAddressId, {
        operation: "confirmAddressId",
        error,
        addressId: id,
      });
    }
  }

  async confirmAddressInfo(
    street: string,
    city: string,
    province: string,
    postalCode: string,
    country?: string,
  ): Promise<Awaited<ReturnType<IDeliveryRepository["confirmAddressInfo"]>>> {
    try {
      const r = await this.db.deliveryAddress.findFirst({
        where: {
          street: street,
          city: city,
          state: province,
          postalCode: postalCode,
          country: country || "CANADA",
        },
        select: {
          id: true,
          street: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
        },
      });

      return r
        ? {
            valid: true,
            address: {
              id: r.id,
              street: r.street,
              city: r.city,
              state: r.state,
              postalCode: r.postalCode,
              country: r.country,
            },
          }
        : { valid: false, address: null };
    } catch (error) {
      throw new DatabaseError(RepositoryFailuresMessages.confirmAddressInfo, {
        operation: "confirmAddressInfo",
        error,
        address: {
          street,
          city,
          province,
          postalCode,
          country,
        },
      });
    }
  }
}

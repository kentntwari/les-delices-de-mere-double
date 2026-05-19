import { BaseController, BadRequestResponse, JsonResponse } from "./base";
import { CustomerMapper, type TCustomerFullDTO } from "../mapper/customer";
import { CustomerService } from "../service/customer";
export class CustomerController extends BaseController {
  constructor(
    req: Request,
    private service: CustomerService = new CustomerService(),
    private mapper: CustomerMapper = new CustomerMapper(),
  ) {
    super(req);
  }

  async list() {
    try {
      const c = await this.service.listCustomers();
      return new JsonResponse({ data: this.mapper.toDtoList(c) });
    } catch (error) {
      this.logError(error, {
        origin: "controllers.customer.list",
      });

      return this.mapErrorResponse(error, {
        origin: "controllers.customer.list",
      });
    }
  }

  async read(id: string) {
    try {
      const customer = await this.service.read(id);

      if (!customer) return new BadRequestResponse("Customer not found");

      return new JsonResponse<{ data: TCustomerFullDTO }>({
        data: this.mapper.toFullDto(customer),
      });
    } catch (error) {
      this.logError(error, {
        origin: "controllers.customer.read",
        customerId: id,
      });

      return this.mapErrorResponse(error, {
        origin: "controllers.customer.read",
        customerId: id,
      });
    }
  }

  async update() {
    return new BadRequestResponse("Not implemented");
  }

  async create() {
    return new BadRequestResponse("Not implemented");
  }

  async delete() {
    return new BadRequestResponse("Not implemented");
  }
}

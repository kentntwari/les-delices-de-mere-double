import { CustomerMapper } from "../mapper/customer";
import { CustomerService } from "../service/customer";
import { BaseController, BadRequestResponse, JsonResponse } from "./base";

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

  async read() {
    return new BadRequestResponse("Not implemented");
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

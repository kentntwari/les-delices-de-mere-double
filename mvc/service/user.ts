import { BaseService } from "./base";
import { UserRepository } from "../repository/user";
import { UserMapper } from "../mapper/user";
import { UserFactory } from "../factories/user";

export class UserService extends BaseService {
  constructor(
    private repository: UserRepository = new UserRepository(),
    private factory: UserFactory = new UserFactory(),
    private mapper: UserMapper = new UserMapper(),
  ) {
    super();
  }

  async listAll() {
    try {
      const model = await this.repository.getAll();
      const list = model.map((user) => {
        const n = UserFactory.fromFullName(user.name);
        return this.factory.build({
          ...model,
          firstName: n.firstName,
          lastName: n.lastName,
        });
      });

      return list.map((e) => ({
        id: e.id,
        name: e.fullName,
      }));
    } catch (error) {
      this.defaultMapError(error, "service.user.listAll");
      throw error;
    }
  }

  async readUser(id: string) {
    try {
      const model = await this.repository.getUser(id);
      if (!model) return null;
      return this.mapper.toEntity(model);
    } catch (error) {
      this.defaultMapError(error, "service.user.readUser");
      throw error;
    }
  }

  async registerUser(data: unknown) {
    try {
      const entity = this.factory.create(data);
      const model = await this.repository.createUser(entity);
      return this.mapper.toEntity(model);
    } catch (error) {
      this.defaultMapError(error, "service.user.registerUser");
      throw error;
    }
  }
}

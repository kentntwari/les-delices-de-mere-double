import { CreateUserFactory } from "../factories/user";

export interface IFactoryStrategyMap {
  readonly registerUser: CreateUserFactory;
}

export const FactoryStrategy: IFactoryStrategyMap = {
  registerUser: new CreateUserFactory(),
};

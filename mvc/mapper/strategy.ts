import { UserMapper, CreateUserMapper } from "./user";

export interface IMapperStrategyMap {
  readonly common: UserMapper;
  readonly registerUser: CreateUserMapper;
}

export const MapperStrategy: IMapperStrategyMap = {
  common: new UserMapper(),
  registerUser: new CreateUserMapper(),
};

export abstract class BaseMapper<TEntity, TModel> {
  abstract toEntity(data: TModel): TEntity;
  // TODOD: Implement full toModel
  abstract toSafeModel(entity: TEntity): Partial<TModel>;
}

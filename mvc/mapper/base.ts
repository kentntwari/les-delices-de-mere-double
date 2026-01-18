export abstract class BaseMapper<TEntity, TDTO, TModel> {
  abstract toEntity(data: TModel): TEntity;
  // TODOD: Implement full toModel
  abstract toSafeModel(entity: TEntity): Partial<TModel>;
  abstract toDto(entity: TEntity): TDTO;
}

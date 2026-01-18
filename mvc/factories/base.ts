export abstract class BaseFactory<TDTO, TEntity> {
  abstract validate(data: unknown): TDTO;
  protected abstract build(data: TDTO): TEntity;

  protected normalize(input: TDTO): TDTO {
    return input;
  }

  public create(data: unknown): TEntity {
    const validated = this.validate(data);
    const normalized = this.normalize(validated);
    return this.build(normalized);
  }
}

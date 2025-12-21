// export abstract class BaseFactory<
//   TEntity,
//   TInput extends Record<string, unknown> = Record<string, unknown>
// > {
//   public create(data: Partial<TInput> = {}): TEntity {
//     const merged = this.mergeWithDefaults(data);
//     const normalized = this.normalizeInput(merged);
//     this.ensureValid(normalized);
//     const prepared = this.beforeBuild(normalized);
//     const entity = this.build(prepared);
//     return this.afterBuild(entity, prepared);
//   }

//   public tryCreate(data: Partial<TInput>): TEntity | null {
//     try {
//       return this.create(data);
//     } catch (error) {
//       this.handleError(error, "create");
//       return null;
//     }
//   }

//   public createMany(dataItems: Array<Partial<TInput>>): TEntity[] {
//     return dataItems
//       .map((item) => this.tryCreate(item))
//       .filter((entity): entity is TEntity => entity !== null);
//   }

//   public clone(entity: TEntity): TEntity {
//     return this.create(this.extractInput(entity));
//   }

//   public rebuild(entity: TEntity, overrides: Partial<TInput>): TEntity {
//     const baseInput = this.extractInput(entity);
//     return this.create({ ...baseInput, ...overrides });
//   }

//   protected mergeWithDefaults(data: Partial<TInput>): TInput {
//     return { ...this.getDefaults(), ...data } as TInput;
//   }

//   protected normalizeInput(data: TInput): TInput {
//     return data;
//   }

//   protected beforeBuild(data: TInput): TInput {
//     return data;
//   }

//   protected afterBuild(entity: TEntity, _data: TInput): TEntity {
//     return entity;
//   }

//   protected handleError(error: unknown, context: string): void {
//     console.error(`[${this.constructor.name}] ${context} failed`, error);
//   }

//   protected abstract getDefaults(): TInput;
//   protected abstract ensureValid(data: TInput): void;
//   protected abstract build(data: TInput): TEntity;
//   protected abstract extractInput(entity: TEntity): TInput;
// }

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

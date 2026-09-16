export interface IBaseRepository<TModel> {
  get(id: string, ...args: any[]): Promise<TModel | null>;
  getAll(): Promise<TModel[]>;
  create(...args: any[]): Promise<Omit<this, "create"> | TModel>;
  delete(id: string, ...args: any[]): Promise<void>;
  update(id: string, ...data: any[]): Promise<Omit<this, "update"> | TModel>;
}

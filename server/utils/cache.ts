import type { Storage, StorageValue } from "unstorage";
import { ApplicationError } from "~~/mvc/errors.appwide";

const logger = createLogger("server.utils.cache");

type NitroCacheCategory = "routes" | "handlers" | "functions";

export class RouteCacheBuilder {
  protected key: string | undefined;

  constructor(
    protected storage: Storage,
    protected category: NitroCacheCategory,
    protected name: string,
  ) {}

  withKey(key: string): Omit<this, "withKey"> {
    this.key = key;
    return this as Omit<this, "withKey">;
  }

  async invalidate(): Promise<void> {
    const prefix = this.buildPrefix();
    const logObj = {
      operation: "invalidate",
      category: this.category,
      name: this.name,
      key: this.key ?? "N/A",
    };

    logger.info(
      logObj,
      `Invalidating cache with prefix: ${prefix}${this.key ? ` and key: ${this.key}` : ""}`,
    );

    try {
      if (this.key) {
        const keys = await this.storage.getKeys(prefix);
        await Promise.all(
          keys.map((k) => k.includes(this.key!) && this.storage.removeItem(k)),
        );
      } else {
        const keys = await this.storage.getKeys(prefix);
        await Promise.all(keys.map((k) => this.storage.removeItem(k)));
      }
    } catch (error) {
      logger.warn(
        { ...logObj, error },
        `Failed to invalidate cache with prefix: ${prefix}`,
      );
      throw CacheError.invalidationFailed(
        prefix,
        error instanceof Error ? error : undefined,
      );
    }
  }

  protected buildPrefix(): string {
    return `nitro:${this.category}:${this.name}:`;
  }
}

export class DataCacheBuilder extends RouteCacheBuilder {
  async get<T>(): Promise<T | null> {
    const prefix = this.buildPrefix();
    const logObj = {
      operation: "get",
      category: this.category,
      name: this.name,
      key: this.key ?? "N/A",
    };

    logger.info(logObj, `Getting cached data with prefix: ${prefix}`);

    try {
      const data = await this.storage.getItem<T>(prefix + ".json");
      return data ?? null;
    } catch (error) {
      logger.warn(
        { ...logObj, error },
        `Failed to get cached data with prefix: ${prefix}`,
      );
      throw CacheError.getFailed(
        prefix,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async set<T extends StorageValue>(data: T): Promise<void> {
    const prefix = this.buildPrefix();
    const logObj = {
      operation: "set",
      category: this.category,
      name: this.name,
      key: this.key ?? "N/A",
    };

    logger.info(logObj, `Setting cached data with prefix: ${prefix}`);

    try {
      await this.storage.setItem<T>(prefix + ".json", data);
    } catch (error) {
      logger.warn(
        { ...logObj, error },
        `Failed to set cached data with prefix: ${prefix}`,
      );
      throw CacheError.setFailed(
        prefix,
        error instanceof Error ? error : undefined,
      );
    }
  }
}

export class CacheUtil {
  constructor(private storage: Storage) {}

  route(name: string): RouteCacheBuilder {
    return new RouteCacheBuilder(this.storage, "routes", name);
  }

  handler(name: string): DataCacheBuilder {
    return new DataCacheBuilder(this.storage, "handlers", name);
  }

  fn(name: string): DataCacheBuilder {
    return new DataCacheBuilder(this.storage, "functions", name);
  }
}

export class CacheError extends ApplicationError {
  constructor(
    message: string,
    public operation: "invalidate" | "get" | "set" | "keys",
    public cachePrefix?: string,
    context: Record<string, unknown> = {},
  ) {
    super(message, { ...context, operation, cachePrefix }, "utils.cache");
    this.name = "CACHE ERROR";
  }

  static invalidationFailed(prefix: string, originalError?: Error): CacheError {
    return new CacheError(
      `Failed to invalidate cache with prefix: ${prefix}`,
      "invalidate",
      prefix,
      { originalError: originalError },
    );
  }

  static getFailed(key: string, originalError?: Error): CacheError {
    return new CacheError(`Failed to retrieve cache item: ${key}`, "get", key, {
      originalError: originalError,
    });
  }

  static keysFailed(prefix: string, originalError?: Error): CacheError {
    return new CacheError(
      `Failed to retrieve cache keys with prefix: ${prefix}`,
      "keys",
      prefix,
      { originalError: originalError },
    );
  }

  static setFailed(key: string, originalError?: Error): CacheError {
    return new CacheError(`Failed to set cache item: ${key}`, "set", key, {
      originalError: originalError,
    });
  }
}

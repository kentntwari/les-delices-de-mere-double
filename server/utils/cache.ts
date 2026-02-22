import type { Storage } from "unstorage";

export class CacheUtil {
  constructor(private storage: Storage) {}

  async invalidateHandlerCache(handlerName: string, handlerKey?: string) {
    const prefix = `nitro:handlers:${handlerName}:${handlerKey ?? ""}`;
    const keys = await this.storage.getKeys(prefix);

    await Promise.all(keys.map((key) => this.storage.removeItem(key)));
  }

  async invalidateAllHandlersCache() {
    const prefix = `nitro:handlers:`;
    const keys = await this.storage.getKeys(prefix);

    await Promise.all(keys.map((key) => this.storage.removeItem(key)));
  }

  getRouteCache(routename: string, routeKey?: string): string {
    const prefix = `nitro:routes:${routename}:${routeKey ?? ""}`;
    return this.storage.getItem(prefix) as unknown as string;
  }

  async invalidateRouteCache(
    routename: string,
    routeKey?: string,
    handlerName?: string,
    handlerKey?: string,
  ) {
    const handlerPrefix = `nitro:handlers:${handlerName ?? routename}:${handlerKey ?? routeKey ?? ""}`;
    const routeprefix = `nitro:routes:${routename}:${routeKey ?? ""}`;

    const rtkeys = await this.storage.getKeys(routeprefix);
    const hdkeys = await this.storage.getKeys(handlerPrefix);
    
    await Promise.all([
      rtkeys.map((key) => this.storage.removeItem(key)),
      hdkeys.map((key) => this.storage.removeItem(key)),
    ]);
  }
}

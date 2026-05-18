export abstract class CacheMapUtil<K, V> {
  /* subclass must provide the ceiling */
  protected abstract readonly max: number;

  private map = new Map<K, V>();

  /* ---------- public facade ---------- */
  get(key: K): V | undefined {
    return this.map.get(key);
  }

  set(key: K, value: V): this {
    if (this.map.has(key)) {
      this.map.delete(key); // bump to newest
    } else if (this.map.size === this.max) {
      const firstKey = this.map.keys().next().value as K;
      this.map.delete(firstKey);
    }
    this.map.set(key, value);
    return this;
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  size(): number {
    return this.map.size;
  }

  keys(): IterableIterator<K> {
    return this.map.keys();
  }

  values(): IterableIterator<V> {
    return this.map.values();
  }

  entries(): IterableIterator<[K, V]> {
    return this.map.entries();
  }
}

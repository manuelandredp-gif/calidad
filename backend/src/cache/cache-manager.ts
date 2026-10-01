export interface CacheItem<T = unknown> {
  value: T;
  expiresAt: number | null;
  tags: string[];
}

export class CacheManager {
  private store: Map<string, CacheItem> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private hits: number = 0;
  private misses: number = 0;

  /**
   * Guarda un valor en el cache con tiempo de vida (TTL) y etiquetas de invalidación (Mejora #4).
   */
  set<T>(key: string, value: T, options?: { ttlSeconds?: number; tags?: string[] }): void {
    const expiresAt = options?.ttlSeconds ? Date.now() + options.ttlSeconds * 1000 : null;
    const tags = options?.tags || [];

    this.store.set(key, { value, expiresAt, tags });

    // Registrar en el índice de tags
    tags.forEach((tag) => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });
  }

  /**
   * Recupera un valor del cache si existe y no ha expirado.
   */
  get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (!item) {
      this.misses++;
      return null;
    }

    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.invalidate(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return item.value as T;
  }

  /**
   * Invalida una clave específica.
   */
  invalidate(key: string): void {
    const item = this.store.get(key);
    if (item) {
      item.tags.forEach((tag) => {
        this.tagIndex.get(tag)?.delete(key);
      });
      this.store.delete(key);
    }
  }

  /**
   * Invalida todas las claves asociadas a una etiqueta de dominio (e.g. "req:123" o "project:456").
   */
  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys || keys.size === 0) return 0;

    let count = 0;
    keys.forEach((key) => {
      this.store.delete(key);
      count++;
    });

    this.tagIndex.delete(tag);
    return count;
  }

  /**
   * Retorna estadísticas del cache.
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? parseFloat(((this.hits / total) * 100).toFixed(1)) : 0;
    return {
      keysCount: this.store.size,
      tagsCount: this.tagIndex.size,
      hits: this.hits,
      misses: this.misses,
      hitRatePercentage: hitRate,
    };
  }

  clear(): void {
    this.store.clear();
    this.tagIndex.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

export const globalCache = new CacheManager();

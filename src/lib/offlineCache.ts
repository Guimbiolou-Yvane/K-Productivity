/**
 * Cache offline simple basé sur localStorage.
 * Utilisé pour afficher les dernières données connues quand le réseau est indisponible.
 * TTL (durée de vie) : 24h par défaut.
 */

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 heures

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export const offlineCache = {
  /**
   * Sauvegarde des données dans le cache local.
   */
  set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
      };
      localStorage.setItem(`kprod_cache_${key}`, JSON.stringify(entry));
    } catch {
      // localStorage peut être plein ou indisponible (mode privé)
      console.warn("[OfflineCache] Impossible d'écrire dans localStorage:", key);
    }
  },

  /**
   * Récupère des données depuis le cache local.
   * Retourne null si absent ou expiré.
   */
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(`kprod_cache_${key}`);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      const isExpired = Date.now() - entry.timestamp > entry.ttl;

      if (isExpired) {
        localStorage.removeItem(`kprod_cache_${key}`);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  },

  /**
   * Supprime une entrée du cache.
   */
  delete(key: string): void {
    try {
      localStorage.removeItem(`kprod_cache_${key}`);
    } catch {}
  },

  /**
   * Vide toutes les entrées du cache Karisma.
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith("kprod_cache_"));
      keys.forEach(k => localStorage.removeItem(k));
    } catch {}
  },

  /**
   * Wrapper : essaie le réseau, tombe sur le cache en cas d'échec.
   * Met à jour le cache si le réseau répond.
   */
  async withFallback<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number = DEFAULT_TTL_MS
  ): Promise<T> {
    try {
      const data = await fetchFn();
      offlineCache.set(key, data, ttlMs);
      return data;
    } catch (error) {
      const cached = offlineCache.get<T>(key);
      if (cached !== null) {
        console.info(`[OfflineCache] Mode hors-ligne : données depuis le cache pour "${key}"`);
        return cached;
      }
      throw error;
    }
  },
};

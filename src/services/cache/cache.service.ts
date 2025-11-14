import { redisConnection } from '@/config/redis.config';

/**
 * Servicio de Caché
 * Maneja operaciones de caché usando Redis
 */
export class CacheService {
  private readonly DEFAULT_TTL = 3600; // 1 hora por defecto

  /**
   * Obtiene un valor del caché
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = redisConnection.getClient();
      if (!client || !redisConnection.isConnected()) {
        return null;
      }

      const value = await client.get(key);
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Error al obtener del caché:', error);
      return null;
    }
  }

  /**
   * Guarda un valor en el caché
   */
  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<boolean> {
    try {
      const client = redisConnection.getClient();
      if (!client || !redisConnection.isConnected()) {
        return false;
      }

      const serialized = JSON.stringify(value);
      await client.setEx(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error('Error al guardar en caché:', error);
      return false;
    }
  }

  /**
   * Elimina una clave del caché
   */
  async delete(key: string): Promise<boolean> {
    try {
      const client = redisConnection.getClient();
      if (!client || !redisConnection.isConnected()) {
        return false;
      }

      await client.del(key);
      return true;
    } catch (error) {
      console.error('Error al eliminar del caché:', error);
      return false;
    }
  }

  /**
   * Elimina todas las claves que coincidan con un patrón
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const client = redisConnection.getClient();
      if (!client || !redisConnection.isConnected()) {
        return 0;
      }

      const keys = await client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      await client.del(keys);
      return keys.length;
    } catch (error) {
      console.error('Error al eliminar patrón del caché:', error);
      return 0;
    }
  }

  /**
   * Genera una clave de caché basada en el endpoint y parámetros
   */
  generateKey(prefix: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return sortedParams 
      ? `cache:${prefix}:${sortedParams}`
      : `cache:${prefix}`;
  }

  /**
   * Invalida el caché relacionado con una entidad
   */
  async invalidateEntity(entity: string, entityId?: string): Promise<void> {
    const patterns = [
      `cache:${entity}:*`,
      `cache:${entity}s:*`,
      `cache:productions:*`, // Las producciones pueden incluir referencias a otras entidades
    ];

    if (entityId) {
      patterns.push(`cache:${entity}:${entityId}*`);
    }

    for (const pattern of patterns) {
      await this.deletePattern(pattern);
    }
  }
}

export const cacheService = new CacheService();


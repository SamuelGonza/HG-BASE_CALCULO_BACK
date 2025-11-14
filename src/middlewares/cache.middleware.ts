import { Request, Response, NextFunction } from 'express';
import { cacheService } from '@/services/cache/cache.service';

/**
 * Middleware de caché para endpoints GET
 * Almacena respuestas en Redis para mejorar el rendimiento
 */
export const cacheMiddleware = (ttl: number = 3600, keyPrefix?: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Solo cachear métodos GET
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generar clave de caché
      const prefix = keyPrefix || req.path;
      const cacheKey = cacheService.generateKey(prefix, {
        ...req.query,
        ...req.params
      });

      // Intentar obtener del caché
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        res.status(200).json(cached);
        return;
      }

      // Guardar la función original de res.json
      const originalJson = res.json.bind(res);

      // Sobrescribir res.json para cachear la respuesta
      res.json = function (body: any) {
        // Cachear solo si la respuesta es exitosa
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, body, ttl).catch(err => {
            console.error('Error al cachear respuesta:', err);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Error en middleware de caché:', error);
      next();
    }
  };
};

/**
 * Middleware para invalidar caché después de operaciones POST/PUT/DELETE
 */
export const invalidateCache = (entity: string, getEntityId?: (req: Request) => string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Guardar la función original de res.json
    const originalJson = res.json.bind(res);

    // Sobrescribir res.json para invalidar caché después de operaciones exitosas
    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = getEntityId ? getEntityId(req) : undefined;
        cacheService.invalidateEntity(entity, entityId).catch(err => {
          console.error('Error al invalidar caché:', err);
        });
      }
      return originalJson(body);
    };

    next();
  };
};


import { Request, Response, NextFunction } from 'express';
import { authService, AuthTokenPayload } from '@/services/auth/auth.service';
import { ResponseError } from '@/utils/erros';
import { UserRole } from '@/models/User.model';

// Extender el tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

/**
 * Middleware de autenticación
 * Verifica que el usuario esté autenticado mediante JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ResponseError(401, 'Token de autenticación requerido');
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token
    const payload = authService.verifyToken(token);
    
    // Agregar información del usuario al request
    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof ResponseError) {
      res.status(error.statusCode).json({
        ok: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(401).json({
        ok: false,
        error: 'Error de autenticación',
        timestamp: new Date().toISOString()
      });
    }
  }
};

/**
 * Middleware de autorización por roles
 * Verifica que el usuario tenga uno de los roles permitidos
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ResponseError(401, 'Usuario no autenticado');
      }

      if (!allowedRoles.includes(req.user.rolSistema)) {
        throw new ResponseError(
          403,
          `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      if (error instanceof ResponseError) {
        res.status(error.statusCode).json({
          ok: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(403).json({
          ok: false,
          error: 'Error de autorización',
          timestamp: new Date().toISOString()
        });
      }
    }
  };
};



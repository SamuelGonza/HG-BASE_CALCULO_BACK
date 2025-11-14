import { Request, Response } from 'express';
import { authService } from '@/services/auth/auth.service';
import { ResponseError } from '@/utils/erros';
import { UserRole } from '@/models/User.model';

export class AuthController {
  /**
   * Registro de nuevo usuario
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, email, password, rol } = req.body;

      if (!nombre || !email || !password || !rol) {
        throw new ResponseError(400, 'Faltan campos requeridos: nombre, email, password, rol');
      }

      if (!['AUXILIAR', 'QUIMICO', 'COORDINADOR', 'AUDITOR'].includes(rol)) {
        throw new ResponseError(400, 'Rol inválido');
      }

      const user = await authService.register(nombre, email, password, rol as UserRole);

      res.status(201).json({
        ok: true,
        message: 'Usuario registrado exitosamente',
        data: {
          id: user._id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        }
      });
    } catch (error) {
      if (error instanceof ResponseError) {
        res.status(error.statusCode).json({
          ok: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          ok: false,
          error: 'Error al registrar usuario'
        });
      }
    }
  }

  /**
   * Login de usuario
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new ResponseError(400, 'Email y contraseña son requeridos');
      }

      const { user, token } = await authService.login(email, password);

      res.status(200).json({
        ok: true,
        message: 'Login exitoso',
        data: {
          token,
          user: {
            id: user._id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
          }
        }
      });
    } catch (error) {
      if (error instanceof ResponseError) {
        res.status(error.statusCode).json({
          ok: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          ok: false,
          error: 'Error al iniciar sesión'
        });
      }
    }
  }

  /**
   * Obtener perfil del usuario autenticado
   * GET /api/auth/me
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new ResponseError(401, 'Usuario no autenticado');
      }

      const user = await authService.getUserById(req.user.userId as any);
      if (!user) {
        throw new ResponseError(404, 'Usuario no encontrado');
      }

      res.status(200).json({
        ok: true,
        data: {
          id: user._id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          activo: user.activo
        }
      });
    } catch (error) {
      if (error instanceof ResponseError) {
        res.status(error.statusCode).json({
          ok: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          ok: false,
          error: 'Error al obtener perfil'
        });
      }
    }
  }

  /**
   * Cambiar contraseña
   * POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new ResponseError(401, 'Usuario no autenticado');
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new ResponseError(400, 'Contraseña actual y nueva contraseña son requeridas');
      }

      await authService.changePassword(
        req.user.userId as any,
        currentPassword,
        newPassword
      );

      res.status(200).json({
        ok: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      if (error instanceof ResponseError) {
        res.status(error.statusCode).json({
          ok: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          ok: false,
          error: 'Error al cambiar contraseña'
        });
      }
    }
  }
}

export const authController = new AuthController();




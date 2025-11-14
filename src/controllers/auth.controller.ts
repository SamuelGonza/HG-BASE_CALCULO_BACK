import { Request, Response } from 'express';
import { Types } from 'mongoose';
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
      const { 
        username, 
        nombre, 
        tipoUsuario, 
        cargo, 
        identificacion, 
        password, 
        rolSistema,
        tarjetaProfesional,
        firma,
        esInterpretacion,
        esProduccion,
        esCalidad
      } = req.body;

      if (!username || !nombre || !tipoUsuario || !cargo || !identificacion || !password || !rolSistema) {
        throw new ResponseError(400, 'Faltan campos requeridos: username, nombre, tipoUsuario, cargo, identificacion, password, rolSistema');
      }

      if (!['AUXILIAR', 'QUIMICO', 'COORDINADOR', 'AUDITOR'].includes(rolSistema)) {
        throw new ResponseError(400, 'Rol de sistema inválido');
      }

      const user = await authService.register(
        username,
        nombre,
        tipoUsuario,
        cargo,
        identificacion,
        password,
        rolSistema as UserRole,
        tarjetaProfesional,
        firma,
        esInterpretacion,
        esProduccion,
        esCalidad
      );

      res.status(201).json({
        ok: true,
        message: 'Usuario registrado exitosamente',
        data: {
          id: user._id,
          username: user.username,
          nombre: user.nombre,
          tipoUsuario: user.tipoUsuario,
          cargo: user.cargo,
          identificacion: user.identificacion,
          tarjetaProfesional: user.tarjetaProfesional,
          firmaUrl: user.firmaUrl,
          firmaPublicId: user.firmaPublicId,
          rolSistema: user.rolSistema,
          esInterpretacion: user.esInterpretacion,
          esProduccion: user.esProduccion,
          esCalidad: user.esCalidad
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
      const { username, password } = req.body;

      if (!username || !password) {
        throw new ResponseError(400, 'Username y contraseña son requeridos');
      }

      const { user, token } = await authService.login(username, password);

      res.status(200).json({
        ok: true,
        message: 'Login exitoso',
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            nombre: user.nombre,
            tipoUsuario: user.tipoUsuario,
            cargo: user.cargo,
            identificacion: user.identificacion,
            tarjetaProfesional: user.tarjetaProfesional,
            rolSistema: user.rolSistema,
            esInterpretacion: user.esInterpretacion,
            esProduccion: user.esProduccion,
            esCalidad: user.esCalidad
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

      const user = await authService.getUserById(new Types.ObjectId(req.user.userId));
      if (!user) {
        throw new ResponseError(404, 'Usuario no encontrado');
      }

      res.status(200).json({
        ok: true,
        data: {
          id: user._id,
          username: user.username,
          nombre: user.nombre,
          tipoUsuario: user.tipoUsuario,
          cargo: user.cargo,
          identificacion: user.identificacion,
          tarjetaProfesional: user.tarjetaProfesional,
          firmaUrl: user.firmaUrl,
          firmaPublicId: user.firmaPublicId,
          rolSistema: user.rolSistema,
          activo: user.activo,
          esInterpretacion: user.esInterpretacion,
          esProduccion: user.esProduccion,
          esCalidad: user.esCalidad
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
        new Types.ObjectId(req.user.userId),
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

import { Request, Response } from 'express';
import { Types } from 'mongoose';
import dayjs from 'dayjs';
import { userService } from '@/services/users/user.service';
import { ResponseError } from '@/utils/erros';

export class UserController {
  /**
   * Obtener todos los usuarios
   * GET /api/users
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const filters: any = {};

      if (req.query.activo !== undefined) {
        filters.activo = req.query.activo === 'true';
      }

      if (req.query.rolSistema) {
        filters.rolSistema = req.query.rolSistema;
      }

      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit as string);
      }

      if (req.query.skip) {
        filters.skip = parseInt(req.query.skip as string);
      }

      const result = await userService.getUsers(filters);

      res.status(200).json({
        ok: true,
        data: result.users,
        pagination: {
          total: result.total,
          limit: result.limit,
          skip: result.skip
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
          error: 'Error al obtener usuarios'
        });
      }
    }
  }

  /**
   * Obtener usuario por ID
   * GET /api/users/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        throw new ResponseError(400, 'ID inválido');
      }

      const user = await userService.getUserById(new Types.ObjectId(id));

      if (!user) {
        throw new ResponseError(404, 'Usuario no encontrado');
      }

      res.status(200).json({
        ok: true,
        data: user
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
          error: 'Error al obtener usuario'
        });
      }
    }
  }

  /**
   * Obtener usuario por username
   * GET /api/users/username/:username
   */
  async getByUsername(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;

      const user = await userService.getUserByUsername(username);

      if (!user) {
        throw new ResponseError(404, 'Usuario no encontrado');
      }

      res.status(200).json({
        ok: true,
        data: user
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
          error: 'Error al obtener usuario'
        });
      }
    }
  }

  /**
   * Actualizar usuario
   * PUT /api/users/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        throw new ResponseError(400, 'ID inválido');
      }

      const {
        nombre,
        tipoUsuario,
        cargo,
        identificacion,
        tarjetaProfesional,
        rolSistema,
        activo,
        esInterpretacion,
        esProduccion,
        esCalidad,
        firma
      } = req.body;

      // Validar rol de sistema si se proporciona
      if (rolSistema && !['AUXILIAR', 'QUIMICO', 'COORDINADOR', 'AUDITOR'].includes(rolSistema)) {
        throw new ResponseError(400, 'Rol de sistema inválido');
      }

      // Validar tipo de usuario si se proporciona
      if (tipoUsuario && !['QUÍMICO FARMACÉUTICO', 'ADMINISTRADOR', 'INVITADO', 'TÉCNICO'].includes(tipoUsuario)) {
        throw new ResponseError(400, 'Tipo de usuario inválido');
      }

      const updateData: any = {};
      if (nombre !== undefined) updateData.nombre = nombre;
      if (tipoUsuario !== undefined) updateData.tipoUsuario = tipoUsuario;
      if (cargo !== undefined) updateData.cargo = cargo;
      if (identificacion !== undefined) updateData.identificacion = identificacion;
      if (tarjetaProfesional !== undefined) updateData.tarjetaProfesional = tarjetaProfesional;
      if (rolSistema !== undefined) updateData.rolSistema = rolSistema;
      if (activo !== undefined) updateData.activo = activo;
      if (esInterpretacion !== undefined) updateData.esInterpretacion = esInterpretacion;
      if (esProduccion !== undefined) updateData.esProduccion = esProduccion;
      if (esCalidad !== undefined) updateData.esCalidad = esCalidad;
      if (firma !== undefined) updateData.firma = firma;

      const user = await userService.updateUser(new Types.ObjectId(id), updateData);

      res.status(200).json({
        ok: true,
        message: 'Usuario actualizado exitosamente',
        data: user
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
          error: 'Error al actualizar usuario'
        });
      }
    }
  }

  /**
   * Cambiar contraseña de usuario (administrador)
   * POST /api/users/:id/change-password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!Types.ObjectId.isValid(id)) {
        throw new ResponseError(400, 'ID inválido');
      }

      if (!newPassword || newPassword.length < 6) {
        throw new ResponseError(400, 'La nueva contraseña debe tener al menos 6 caracteres');
      }

      await userService.changeUserPassword(new Types.ObjectId(id), newPassword);

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

  /**
   * Desactivar usuario
   * POST /api/users/:id/deactivate
   */
  async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        throw new ResponseError(400, 'ID inválido');
      }

      const user = await userService.deactivateUser(new Types.ObjectId(id));

      res.status(200).json({
        ok: true,
        message: 'Usuario desactivado exitosamente',
        data: user
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
          error: 'Error al desactivar usuario'
        });
      }
    }
  }

  /**
   * Activar usuario
   * POST /api/users/:id/activate
   */
  async activate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        throw new ResponseError(400, 'ID inválido');
      }

      const user = await userService.activateUser(new Types.ObjectId(id));

      res.status(200).json({
        ok: true,
        message: 'Usuario activado exitosamente',
        data: user
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
          error: 'Error al activar usuario'
        });
      }
    }
  }

  /**
   * Eliminar usuario permanentemente
   * DELETE /api/users/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        throw new ResponseError(400, 'ID inválido');
      }

      await userService.deleteUser(new Types.ObjectId(id));

      res.status(200).json({
        ok: true,
        message: 'Usuario eliminado permanentemente'
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
          error: 'Error al eliminar usuario'
        });
      }
    }
  }
}

export const userController = new UserController();


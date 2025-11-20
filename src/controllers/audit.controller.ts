import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { auditService } from '@/services/workflow/audit.service';
import { ResponseError } from '@/utils/erros';

export class AuditController {
  /**
   * Obtener historial de auditoría de una entidad
   * GET /api/audit/:entidad/:entidadId
   */
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const { entidad, entidadId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      if (!Types.ObjectId.isValid(entidadId)) {
        throw new ResponseError(400, 'ID de entidad inválido');
      }

      const history = await auditService.getAuditHistory(
        entidad,
        new Types.ObjectId(entidadId),
        limit
      );

      res.status(200).json({
        ok: true,
        data: history
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
          error: 'Error al obtener historial de auditoría'
        });
      }
    }
  }

  /**
   * Obtener acciones de un usuario
   * GET /api/audit/user/:userId
   */
  async getUserActions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      if (!Types.ObjectId.isValid(userId)) {
        throw new ResponseError(400, 'ID de usuario inválido');
      }

      const actions = await auditService.getUserActions(
        new Types.ObjectId(userId),
        limit
      );

      res.status(200).json({
        ok: true,
        data: actions
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
          error: 'Error al obtener acciones del usuario'
        });
      }
    }
  }

  /**
   * Obtener acciones por tipo de entidad
   * GET /api/audit/entity/:entidad
   */
  async getActionsByEntity(req: Request, res: Response): Promise<void> {
    try {
      const { entidad } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const actions = await auditService.getActionsByEntity(entidad, limit);

      res.status(200).json({
        ok: true,
        data: actions
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al obtener acciones por entidad'
      });
    }
  }

  /**
   * Obtener lista de tipos de entidades disponibles
   * GET /api/audit/filters/entities
   */
  async getAvailableEntities(req: Request, res: Response): Promise<void> {
    try {
      const entities = await auditService.getAvailableEntities();

      res.status(200).json({
        ok: true,
        data: entities
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al obtener tipos de entidades'
      });
    }
  }

  /**
   * Obtener lista de usuarios que han realizado acciones
   * GET /api/audit/filters/users
   */
  async getAvailableUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await auditService.getAvailableUsers();

      res.status(200).json({
        ok: true,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al obtener usuarios'
      });
    }
  }

  /**
   * Obtener entidades específicas de un tipo
   * GET /api/audit/filters/entities/:entidad/items
   */
  async getEntitiesOfType(req: Request, res: Response): Promise<void> {
    try {
      const { entidad } = req.params;
      
      console.log('[AUDIT] Obteniendo entidades de tipo:', entidad);
      
      const entities = await auditService.getEntitiesOfType(entidad);

      console.log('[AUDIT] Entidades encontradas:', entities.length);

      res.status(200).json({
        ok: true,
        data: entities
      });
    } catch (error) {
      console.error('[AUDIT ERROR] Error al obtener entidades:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener entidades';
      res.status(500).json({
        ok: false,
        error: errorMessage
      });
    }
  }
}

export const auditController = new AuditController();




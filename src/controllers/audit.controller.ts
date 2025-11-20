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

      console.log('[AUDIT] Obteniendo historial:', { entidad, entidadId, limit });

      if (!Types.ObjectId.isValid(entidadId)) {
        console.error('[AUDIT] ID de entidad inválido:', entidadId);
        throw new ResponseError(400, 'ID de entidad inválido');
      }

      const history = await auditService.getAuditHistory(
        entidad,
        new Types.ObjectId(entidadId),
        limit
      );

      console.log('[AUDIT] Registros encontrados:', history.length);

      res.status(200).json({
        ok: true,
        data: history
      });
    } catch (error) {
      console.error('[AUDIT ERROR]:', error);
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

      console.log('[AUDIT] Obteniendo acciones de usuario:', { userId, limit });

      if (!Types.ObjectId.isValid(userId)) {
        console.error('[AUDIT] ID de usuario inválido:', userId);
        throw new ResponseError(400, 'ID de usuario inválido');
      }

      const actions = await auditService.getUserActions(
        new Types.ObjectId(userId),
        limit
      );

      console.log('[AUDIT] Acciones encontradas:', actions.length);

      res.status(200).json({
        ok: true,
        data: actions
      });
    } catch (error) {
      console.error('[AUDIT ERROR]:', error);
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
      console.log('[AUDIT] Obteniendo usuarios disponibles');
      const users = await auditService.getAvailableUsers();
      console.log('[AUDIT] Usuarios encontrados:', users.length);

      res.status(200).json({
        ok: true,
        data: users
      });
    } catch (error) {
      console.error('[AUDIT ERROR]:', error);
      res.status(500).json({
        ok: false,
        error: 'Error al obtener usuarios'
      });
    }
  }

  /**
   * Obtener todas las auditorías
   * GET /api/audit/all
   */
  async getAllAudits(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;

      console.log('[AUDIT] Obteniendo todas las auditorías:', { limit, skip });

      const result = await auditService.getAllAudits(limit, skip);

      console.log('[AUDIT] Total de auditorías:', result.total);

      res.status(200).json({
        ok: true,
        data: result.audits,
        pagination: {
          total: result.total,
          limit,
          skip
        }
      });
    } catch (error) {
      console.error('[AUDIT ERROR]:', error);
      res.status(500).json({
        ok: false,
        error: 'Error al obtener auditorías'
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




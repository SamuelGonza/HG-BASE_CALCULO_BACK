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
}

export const auditController = new AuditController();




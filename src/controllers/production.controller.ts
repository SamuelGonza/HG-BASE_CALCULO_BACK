import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { productionService } from '@/services/production/production.service';
import { productionWorkflowService } from '@/services/workflow/productionWorkflow.service';
import { ResponseError } from '@/utils/erros';

export class ProductionController {
  /**
   * Crear nueva producción
   * POST /api/productions
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new ResponseError(401, 'Usuario no autenticado');
      }

      const production = await productionService.createProduction(
        req.body,
        req.user.userId as any
      );

      res.status(201).json({
        ok: true,
        message: 'Producción creada exitosamente',
        data: production
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
          error: 'Error al crear producción'
        });
      }
    }
  }

  /**
   * Obtener producción por ID
   * GET /api/productions/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        throw new ResponseError(400, 'ID inválido');
      }

      const production = await productionService.getProductionById(new Types.ObjectId(id));

      if (!production) {
        throw new ResponseError(404, 'Producción no encontrada');
      }

      res.status(200).json({
        ok: true,
        data: production
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
          error: 'Error al obtener producción'
        });
      }
    }
  }

  /**
   * Obtener todas las producciones con filtros
   * GET /api/productions
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const filters: any = {};

      if (req.query.estado) {
        filters.estado = req.query.estado;
      }

      if (req.query.lineaProduccion) {
        filters.lineaProduccion = req.query.lineaProduccion;
      }

      if (req.query.fechaDesde) {
        filters.fechaDesde = new Date(req.query.fechaDesde as string);
      }

      if (req.query.fechaHasta) {
        filters.fechaHasta = new Date(req.query.fechaHasta as string);
      }

      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit as string);
      }

      if (req.query.skip) {
        filters.skip = parseInt(req.query.skip as string);
      }

      const result = await productionService.getProductions(filters);

      res.status(200).json({
        ok: true,
        data: result.productions,
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
          error: 'Error al obtener producciones'
        });
      }
    }
  }

  /**
   * Validar y calcular producción
   * POST /api/productions/:id/validate-calculate
   */
  async validateAndCalculate(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new ResponseError(401, 'Usuario no autenticado');
      }

      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        throw new ResponseError(400, 'ID inválido');
      }

      const production = await productionService.validateAndCalculate(
        new Types.ObjectId(id),
        req.user.userId as any,
        req.user.rolSistema
      );

      res.status(200).json({
        ok: true,
        message: 'Producción validada y calculada exitosamente',
        data: production
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
          error: 'Error al validar y calcular producción'
        });
      }
    }
  }

  /**
   * Transicionar producción a siguiente estado
   * POST /api/productions/:id/transition
   */
  async transition(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new ResponseError(401, 'Usuario no autenticado');
      }

      const { id } = req.params;
      const { estado } = req.body;

      if (!Types.ObjectId.isValid(id)) {
        throw new ResponseError(400, 'ID inválido');
      }

      if (!estado) {
        throw new ResponseError(400, 'Estado requerido');
      }

      const production = await productionWorkflowService.transitionToState(
        new Types.ObjectId(id),
        estado,
        req.user.userId as any,
        req.user.rolSistema
      );

      res.status(200).json({
        ok: true,
        message: `Producción transicionada a ${estado}`,
        data: production
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
          error: 'Error al transicionar producción'
        });
      }
    }
  }
}

export const productionController = new ProductionController();




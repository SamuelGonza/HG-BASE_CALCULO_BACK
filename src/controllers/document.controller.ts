import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { documentGenerationService } from '@/services/documents/documentGeneration.service';
import { ResponseError } from '@/utils/erros';

export class DocumentController {
  /**
   * Generar documento específico
   * POST /api/documents/:productionId/:tipo
   */
  async generate(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new ResponseError(401, 'Usuario no autenticado');
      }

      const { productionId, tipo } = req.params;

      if (!Types.ObjectId.isValid(productionId)) {
        throw new ResponseError(400, 'ID de producción inválido');
      }

      const validTypes = ['SOLICITUD', 'ORDEN', 'INSUMOS', 'QC', 'ETIQUETAS', 'ACTA'];
      if (!validTypes.includes(tipo)) {
        throw new ResponseError(400, 'Tipo de documento inválido');
      }

      let fileUrl: string;

      switch (tipo) {
        case 'SOLICITUD':
          fileUrl = await documentGenerationService.generateSolicitud(
            new Types.ObjectId(productionId),
            req.user.userId as any
          );
          break;
        case 'ORDEN':
          fileUrl = await documentGenerationService.generateOrden(
            new Types.ObjectId(productionId),
            req.user.userId as any
          );
          break;
        case 'INSUMOS':
          fileUrl = await documentGenerationService.generateSolicitudInsumos(
            new Types.ObjectId(productionId),
            req.user.userId as any
          );
          break;
        case 'QC':
          fileUrl = await documentGenerationService.generateQC(
            new Types.ObjectId(productionId),
            req.user.userId as any
          );
          break;
        case 'ETIQUETAS':
          fileUrl = await documentGenerationService.generateEtiquetas(
            new Types.ObjectId(productionId),
            req.user.userId as any
          );
          break;
        case 'ACTA':
          fileUrl = await documentGenerationService.generateActaEntrega(
            new Types.ObjectId(productionId),
            req.user.userId as any
          );
          break;
        default:
          throw new ResponseError(400, 'Tipo de documento no soportado');
      }

      res.status(200).json({
        ok: true,
        message: `Documento ${tipo} generado exitosamente`,
        data: {
          fileUrl,
          tipo
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
          error: 'Error al generar documento'
        });
      }
    }
  }

  /**
   * Generar todos los documentos disponibles
   * POST /api/documents/:productionId/generate-all
   */
  async generateAll(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new ResponseError(401, 'Usuario no autenticado');
      }

      const { productionId } = req.params;

      if (!Types.ObjectId.isValid(productionId)) {
        throw new ResponseError(400, 'ID de producción inválido');
      }

      const documents = await documentGenerationService.generateAllAvailableDocuments(
        new Types.ObjectId(productionId),
        req.user.userId as any
      );

      res.status(200).json({
        ok: true,
        message: 'Documentos generados',
        data: documents
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
          error: 'Error al generar documentos'
        });
      }
    }
  }

  /**
   * Obtener todos los documentos de una producción
   * GET /api/documents/:productionId
   */
  async getByProduction(req: Request, res: Response): Promise<void> {
    try {
      const { productionId } = req.params;

      if (!Types.ObjectId.isValid(productionId)) {
        throw new ResponseError(400, 'ID de producción inválido');
      }

      const documents = await documentGenerationService.getProductionDocuments(
        new Types.ObjectId(productionId)
      );

      res.status(200).json({
        ok: true,
        data: documents
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
          error: 'Error al obtener documentos'
        });
      }
    }
  }
}

export const documentController = new DocumentController();




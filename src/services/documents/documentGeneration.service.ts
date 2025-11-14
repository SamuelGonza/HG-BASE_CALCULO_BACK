import { Types } from 'mongoose';
import { Production } from '@/models/Production.model';
import { Document, DocumentType } from '@/models/Document.model';
import { ResponseError } from '@/utils/erros';
import { calculationEngineService } from '../calculation/calculationEngine.service';

/**
 * Servicio de Generación de Documentos
 * Genera automáticamente todos los documentos requeridos para la producción
 */
export class DocumentGenerationService {
  private readonly PLANTILLA_VERSION = '1.0.0';

  /**
   * Genera un documento de solicitud de producción
   */
  async generateSolicitud(
    productionId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<string> {
    const production = await Production.findById(productionId)
      .populate('medicamentoId laboratorioId vehiculoId envaseId paciente');

    if (!production) {
      throw new ResponseError(404, 'Producción no encontrada');
    }

    // TODO: Implementar generación real de PDF usando librería como pdfkit o puppeteer
    // Por ahora retornamos una URL simulada
    const fileUrl = `/documents/solicitud-${productionId}.pdf`;

    await Document.create({
      productionId,
      tipo: 'SOLICITUD',
      fileUrl,
      versionPlantilla: this.PLANTILLA_VERSION,
      generadoPor: userId,
      generadoEn: new Date()
    });

    return fileUrl;
  }

  /**
   * Genera una orden de producción
   */
  async generateOrden(
    productionId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<string> {
    const production = await Production.findById(productionId)
      .populate('medicamentoId laboratorioId vehiculoId envaseId');

    if (!production) {
      throw new ResponseError(404, 'Producción no encontrada');
    }

    if (!production.resultadosCalculo) {
      throw new ResponseError(400, 'La producción debe estar calculada para generar la orden');
    }

    // TODO: Implementar generación real de PDF
    const fileUrl = `/documents/orden-${productionId}.pdf`;

    await Document.create({
      productionId,
      tipo: 'ORDEN',
      fileUrl,
      versionPlantilla: this.PLANTILLA_VERSION,
      generadoPor: userId,
      generadoEn: new Date()
    });

    return fileUrl;
  }

  /**
   * Genera solicitud de insumos
   */
  async generateSolicitudInsumos(
    productionId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<string> {
    const production = await Production.findById(productionId)
      .populate('medicamentoId laboratorioId vehiculoId envaseId');

    if (!production) {
      throw new ResponseError(404, 'Producción no encontrada');
    }

    if (!production.resultadosCalculo) {
      throw new ResponseError(400, 'La producción debe estar calculada para generar la solicitud de insumos');
    }

    // TODO: Implementar generación real de PDF/Excel
    const fileUrl = `/documents/insumos-${productionId}.pdf`;

    await Document.create({
      productionId,
      tipo: 'INSUMOS',
      fileUrl,
      versionPlantilla: this.PLANTILLA_VERSION,
      generadoPor: userId,
      generadoEn: new Date()
    });

    return fileUrl;
  }

  /**
   * Genera documento de control de calidad
   */
  async generateQC(
    productionId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<string> {
    const production = await Production.findById(productionId)
      .populate('medicamentoId laboratorioId vehiculoId envaseId');

    if (!production) {
      throw new ResponseError(404, 'Producción no encontrada');
    }

    if (production.estado !== 'QC' && production.estado !== 'ETIQUETADO' && production.estado !== 'FINALIZADO') {
      throw new ResponseError(400, 'La producción debe estar en estado QC o superior para generar el documento de control de calidad');
    }

    // TODO: Implementar generación real de PDF
    const fileUrl = `/documents/qc-${productionId}.pdf`;

    await Document.create({
      productionId,
      tipo: 'QC',
      fileUrl,
      versionPlantilla: this.PLANTILLA_VERSION,
      generadoPor: userId,
      generadoEn: new Date()
    });

    return fileUrl;
  }

  /**
   * Genera etiquetas para el producto
   */
  async generateEtiquetas(
    productionId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<string> {
    const production = await Production.findById(productionId)
      .populate('medicamentoId laboratorioId vehiculoId envaseId');

    if (!production) {
      throw new ResponseError(404, 'Producción no encontrada');
    }

    if (production.estado !== 'ETIQUETADO' && production.estado !== 'FINALIZADO') {
      throw new ResponseError(400, 'La producción debe estar etiquetada para generar las etiquetas');
    }

    // TODO: Implementar generación real de etiquetas imprimibles
    const fileUrl = `/documents/etiquetas-${productionId}.pdf`;

    await Document.create({
      productionId,
      tipo: 'ETIQUETAS',
      fileUrl,
      versionPlantilla: this.PLANTILLA_VERSION,
      generadoPor: userId,
      generadoEn: new Date()
    });

    return fileUrl;
  }

  /**
   * Genera acta de entrega
   */
  async generateActaEntrega(
    productionId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<string> {
    const production = await Production.findById(productionId)
      .populate('medicamentoId laboratorioId vehiculoId envaseId');

    if (!production) {
      throw new ResponseError(404, 'Producción no encontrada');
    }

    if (production.estado !== 'FINALIZADO') {
      throw new ResponseError(400, 'La producción debe estar finalizada para generar el acta de entrega');
    }

    // TODO: Implementar generación real de PDF
    const fileUrl = `/documents/acta-${productionId}.pdf`;

    await Document.create({
      productionId,
      tipo: 'ACTA',
      fileUrl,
      versionPlantilla: this.PLANTILLA_VERSION,
      generadoPor: userId,
      generadoEn: new Date()
    });

    return fileUrl;
  }

  /**
   * Genera todos los documentos disponibles según el estado de la producción
   */
  async generateAllAvailableDocuments(
    productionId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<Record<DocumentType, string | null>> {
    const production = await Production.findById(productionId);

    if (!production) {
      throw new ResponseError(404, 'Producción no encontrada');
    }

    const documents: Record<DocumentType, string | null> = {
      SOLICITUD: null,
      ORDEN: null,
      INSUMOS: null,
      QC: null,
      ETIQUETAS: null,
      ACTA: null
    };

    try {
      documents.SOLICITUD = await this.generateSolicitud(productionId, userId);
    } catch (error) {
      // Ignorar errores individuales
    }

    if (production.estado !== 'CREADO' && production.estado !== 'VALIDADO') {
      try {
        documents.ORDEN = await this.generateOrden(productionId, userId);
        documents.INSUMOS = await this.generateSolicitudInsumos(productionId, userId);
      } catch (error) {
        // Ignorar errores individuales
      }
    }

    if (['QC', 'ETIQUETADO', 'FINALIZADO'].includes(production.estado)) {
      try {
        documents.QC = await this.generateQC(productionId, userId);
      } catch (error) {
        // Ignorar errores individuales
      }
    }

    if (['ETIQUETADO', 'FINALIZADO'].includes(production.estado)) {
      try {
        documents.ETIQUETAS = await this.generateEtiquetas(productionId, userId);
      } catch (error) {
        // Ignorar errores individuales
      }
    }

    if (production.estado === 'FINALIZADO') {
      try {
        documents.ACTA = await this.generateActaEntrega(productionId, userId);
      } catch (error) {
        // Ignorar errores individuales
      }
    }

    return documents;
  }

  /**
   * Obtiene todos los documentos generados para una producción
   */
  async getProductionDocuments(productionId: Types.ObjectId) {
    return await Document.find({ productionId })
      .populate('generadoPor', 'nombre email rol')
      .sort({ generadoEn: -1 });
  }
}

export const documentGenerationService = new DocumentGenerationService();




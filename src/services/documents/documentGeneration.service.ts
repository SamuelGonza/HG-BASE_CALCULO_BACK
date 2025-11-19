import { Types } from 'mongoose';
import dayjs from 'dayjs';
import { Production } from '@/models/Production.model';
import { Document, DocumentType } from '@/models/Document.model';
import { ResponseError } from '@/utils/erros';
import { calculationEngineService } from '../calculation/calculationEngine.service';
import { cloudinaryService } from '@/services/cloudinary/cloudinary.service';

/**
 * Servicio de Generaci?n de Documentos
 * Genera autom?ticamente todos los documentos requeridos para la producci?n
 */
export class DocumentGenerationService {
  private readonly PLANTILLA_VERSION = '1.0.0';

  /**
   * Genera un documento de solicitud de producci?n
   */
  async generateSolicitud(
    productionId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<string> {
    const production = await Production.findById(productionId)
      .populate('creadoPor validadoPor calculadoPor programadoPor producidoPor qcPor etiquetadoPor finalizadoPor', 'username nombre tipoUsuario cargo rolSistema');

    if (!production) {
      throw new ResponseError(404, 'Producci?n no encontrada');
    }

    // TODO: Implementar generaci?n real de PDF usando librer?a como pdfkit o puppeteer
    // Por ahora simulamos la generaci?n y subimos a Cloudinary
    const fileName = `solicitud-${productionId.toString()}`;
    const pdfBuffer = Buffer.from(`PDF simulado para solicitud de producci?n ${productionId}`);
    
    // Subir a Cloudinary
    const uploadResult = await cloudinaryService.uploadDocument(
      pdfBuffer,
      'documentos',
      fileName
    );

    await Document.create({
      productionId,
      tipo: 'SOLICITUD',
      fileUrl: uploadResult.secure_url,
      filePublicId: uploadResult.public_id,
      versionPlantilla: this.PLANTILLA_VERSION,
      generadoPor: userId,
      generadoEn: dayjs().toDate()
    });

    return uploadResult.secure_url;
  }

  /**
   * Genera una orden de producci?n
   */
  async generateOrden(
    productionId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<string> {
    const production = await Production.findById(productionId)
      .populate('creadoPor validadoPor calculadoPor programadoPor producidoPor qcPor etiquetadoPor finalizadoPor', 'username nombre tipoUsuario cargo rolSistema');

    if (!production) {
      throw new ResponseError(404, 'Producci?n no encontrada');
    }

    if (production.estado === 'CREADO' || production.estado === 'VALIDADO') {
      throw new ResponseError(400, 'La producci?n debe estar calculada para generar la orden');
    }

    // TODO: Implementar generaci?n real de PDF
    const fileName = `orden-${productionId.toString()}`;
    const pdfBuffer = Buffer.from(`PDF simulado para orden de producci?n ${productionId}`);
    
    const uploadResult = await cloudinaryService.uploadDocument(
      pdfBuffer,
      'documentos',
      fileName
    );

    await Document.create({
      productionId,
      tipo: 'ORDEN',
      fileUrl: uploadResult.secure_url,
      filePublicId: uploadResult.public_id,
      versionPlantilla: this.PLANTILLA_VERSION,
      generadoPor: userId,
      generadoEn: dayjs().toDate()
    });

    return uploadResult.secure_url;
  }

  /**
   * Genera solicitud de insumos
   */
  async generateSolicitudInsumos(
    productionId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<string> {
    const production = await Production.findById(productionId)
      .populate('creadoPor validadoPor calculadoPor programadoPor producidoPor qcPor etiquetadoPor finalizadoPor', 'username nombre tipoUsuario cargo rolSistema');

    if (!production) {
      throw new ResponseError(404, 'Producci?n no encontrada');
    }

    if (production.estado === 'CREADO' || production.estado === 'VALIDADO') {
      throw new ResponseError(400, 'La producci?n debe estar calculada para generar la solicitud de insumos');
    }

    // TODO: Implementar generaci?n real de PDF/Excel
    const fileName = `insumos-${productionId.toString()}`;
    const pdfBuffer = Buffer.from(`PDF simulado para solicitud de insumos ${productionId}`);
    
    const uploadResult = await cloudinaryService.uploadDocument(
      pdfBuffer,
      'documentos',
      fileName
    );

    await Document.create({
      productionId,
      tipo: 'INSUMOS',
      fileUrl: uploadResult.secure_url,
      filePublicId: uploadResult.public_id,
      versionPlantilla: this.PLANTILLA_VERSION,
      generadoPor: userId,
      generadoEn: dayjs().toDate()
    });

    return uploadResult.secure_url;
  }

  /**
   * Genera documento de control de calidad
   */
  async generateQC(
    productionId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<string> {
    const production = await Production.findById(productionId)
      .populate('creadoPor validadoPor calculadoPor programadoPor producidoPor qcPor etiquetadoPor finalizadoPor', 'username nombre tipoUsuario cargo rolSistema');

    if (!production) {
      throw new ResponseError(404, 'Producci?n no encontrada');
    }

    if (production.estado !== 'QC' && production.estado !== 'ETIQUETADO' && production.estado !== 'FINALIZADO') {
      throw new ResponseError(400, 'La producci?n debe estar en estado QC o superior para generar el documento de control de calidad');
    }

    // TODO: Implementar generaci?n real de PDF
    const fileName = `qc-${productionId.toString()}`;
    const pdfBuffer = Buffer.from(`PDF simulado para control de calidad ${productionId}`);
    
    const uploadResult = await cloudinaryService.uploadDocument(
      pdfBuffer,
      'documentos',
      fileName
    );

    await Document.create({
      productionId,
      tipo: 'QC',
      fileUrl: uploadResult.secure_url,
      filePublicId: uploadResult.public_id,
      versionPlantilla: this.PLANTILLA_VERSION,
      generadoPor: userId,
      generadoEn: dayjs().toDate()
    });

    return uploadResult.secure_url;
  }

  /**
   * Genera etiquetas para el producto
   */
  async generateEtiquetas(
    productionId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<string> {
    const production = await Production.findById(productionId)
      .populate('creadoPor validadoPor calculadoPor programadoPor producidoPor qcPor etiquetadoPor finalizadoPor', 'username nombre tipoUsuario cargo rolSistema');

    if (!production) {
      throw new ResponseError(404, 'Producci?n no encontrada');
    }

    if (production.estado !== 'ETIQUETADO' && production.estado !== 'FINALIZADO') {
      throw new ResponseError(400, 'La producci?n debe estar etiquetada para generar las etiquetas');
    }

    // TODO: Implementar generaci?n real de etiquetas imprimibles
    const fileName = `etiquetas-${productionId.toString()}`;
    const pdfBuffer = Buffer.from(`PDF simulado para etiquetas ${productionId}`);
    
    const uploadResult = await cloudinaryService.uploadDocument(
      pdfBuffer,
      'documentos',
      fileName
    );

    await Document.create({
      productionId,
      tipo: 'ETIQUETAS',
      fileUrl: uploadResult.secure_url,
      filePublicId: uploadResult.public_id,
      versionPlantilla: this.PLANTILLA_VERSION,
      generadoPor: userId,
      generadoEn: dayjs().toDate()
    });

    return uploadResult.secure_url;
  }

  /**
   * Genera acta de entrega
   */
  async generateActaEntrega(
    productionId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<string> {
    const production = await Production.findById(productionId)
      .populate('creadoPor validadoPor calculadoPor programadoPor producidoPor qcPor etiquetadoPor finalizadoPor', 'username nombre tipoUsuario cargo rolSistema');

    if (!production) {
      throw new ResponseError(404, 'Producci?n no encontrada');
    }

    if (production.estado !== 'FINALIZADO') {
      throw new ResponseError(400, 'La producci?n debe estar finalizada para generar el acta de entrega');
    }

    // TODO: Implementar generaci?n real de PDF
    const fileName = `acta-${productionId.toString()}`;
    const pdfBuffer = Buffer.from(`PDF simulado para acta de entrega ${productionId}`);
    
    const uploadResult = await cloudinaryService.uploadDocument(
      pdfBuffer,
      'documentos',
      fileName
    );

    await Document.create({
      productionId,
      tipo: 'ACTA',
      fileUrl: uploadResult.secure_url,
      filePublicId: uploadResult.public_id,
      versionPlantilla: this.PLANTILLA_VERSION,
      generadoPor: userId,
      generadoEn: dayjs().toDate()
    });

    return uploadResult.secure_url;
  }

  /**
   * Genera todos los documentos disponibles seg?n el estado de la producci?n
   */
  async generateAllAvailableDocuments(
    productionId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<Record<DocumentType, string | null>> {
    const production = await Production.findById(productionId);

    if (!production) {
      throw new ResponseError(404, 'Producci?n no encontrada');
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
   * Obtiene todos los documentos generados para una producci?n
   */
  async getProductionDocuments(productionId: Types.ObjectId) {
    return await Document.find({ productionId })
      .populate('generadoPor', 'username nombre tipoUsuario cargo rolSistema')
      .sort({ generadoEn: -1 });
  }
}

export const documentGenerationService = new DocumentGenerationService();

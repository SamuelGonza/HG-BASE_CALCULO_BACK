import { Types } from 'mongoose';
import dayjs from 'dayjs';
import PDFDocument from 'pdfkit';
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
   * Genera un PDF básico con información de la producción
   * @param title - Título del documento
   * @param production - Datos de la producción
   * @returns Buffer del PDF generado
   */
  private async generatePDF(title: string, production: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const chunks: Buffer[] = [];

        // Recolectar chunks del PDF
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text(title, { align: 'center' });
        doc.moveDown();

        // Información de la producción
        doc.fontSize(12);
        doc.text(`Código de Producción: ${production.codigo}`, { continued: false });
        doc.text(`Línea de Producción: ${production.lineaProduccion}`);
        doc.text(`Estado: ${production.estado}`);
        doc.text(`Fecha de Producción: ${production.fechaProduccion ? dayjs(production.fechaProduccion).format('DD/MM/YYYY HH:mm') : 'N/A'}`);
        doc.text(`Cantidad de Mezclas: ${production.cantidadMezclas}`);
        doc.moveDown();

        // QF
        if (production.qfInterpretacion || production.qfProduccion || production.qfCalidad) {
          doc.fontSize(14).text('Químicos Farmacéuticos:', { underline: true });
          doc.fontSize(12);
          if (production.qfInterpretacion) doc.text(`Interpretación: ${production.qfInterpretacion}`);
          if (production.qfProduccion) doc.text(`Producción: ${production.qfProduccion}`);
          if (production.qfCalidad) doc.text(`Calidad: ${production.qfCalidad}`);
          doc.moveDown();
        }

        // Mezclas
        if (production.mezclas && production.mezclas.length > 0) {
          doc.fontSize(14).text('Mezclas:', { underline: true });
          doc.moveDown(0.5);

          production.mezclas.forEach((mezcla: any, index: number) => {
            doc.fontSize(12);
            doc.text(`${index + 1}. ${mezcla.medicamento.nombre}`, { continued: false });
            doc.fontSize(10);
            doc.text(`   Paciente: ${mezcla.paciente.nombre}`);
            doc.text(`   Documento: ${mezcla.paciente.documento}`);
            doc.text(`   Dosis: ${mezcla.medicamento.dosisPrescrita} ${mezcla.medicamento.unidadDosis}`);
            doc.text(`   Lote: ${mezcla.loteMezcla}`);
            doc.text(`   Vencimiento: ${dayjs(mezcla.fechaVencimiento).format('DD/MM/YYYY HH:mm')}`);
            doc.moveDown(0.5);
          });
        }

        // Footer
        doc.fontSize(8).text(
          `Generado el ${dayjs().format('DD/MM/YYYY HH:mm')} - Versión ${this.PLANTILLA_VERSION}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

        // Finalizar el documento
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

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

    // Generar PDF real
    const fileName = `solicitud-${productionId.toString()}`;
    const pdfBuffer = await this.generatePDF('SOLICITUD DE PRODUCCIÓN', production);
    
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

    // Generar PDF real
    const fileName = `orden-${productionId.toString()}`;
    const pdfBuffer = await this.generatePDF('ORDEN DE PRODUCCIÓN', production);
    
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

    // Generar PDF real
    const fileName = `insumos-${productionId.toString()}`;
    const pdfBuffer = await this.generatePDF('SOLICITUD DE INSUMOS', production);
    
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

    // Generar PDF real
    const fileName = `qc-${productionId.toString()}`;
    const pdfBuffer = await this.generatePDF('CONTROL DE CALIDAD', production);
    
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

    // Generar PDF real
    const fileName = `etiquetas-${productionId.toString()}`;
    const pdfBuffer = await this.generatePDF('ETIQUETAS DE PRODUCCIÓN', production);
    
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

    // Generar PDF real
    const fileName = `acta-${productionId.toString()}`;
    const pdfBuffer = await this.generatePDF('ACTA DE ENTREGA', production);
    
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

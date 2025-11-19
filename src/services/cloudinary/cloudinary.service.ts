import { v2 as cloudinary } from 'cloudinary';
import { GLOBAL_ENV } from '@/shared/constants';
import { ResponseError } from '@/utils/erros';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: GLOBAL_ENV.CLOUD_NAME,
  api_key: GLOBAL_ENV.API_KEY_CLOUDINARY,
  api_secret: GLOBAL_ENV.API_SECRET_CLOUDINARY
});

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  secure_url: string;
}

/**
 * Servicio de Cloudinary
 * Maneja la subida de archivos (firmas y documentos) a Cloudinary
 */
export class CloudinaryService {
  /**
   * Sube una imagen (firma) a Cloudinary
   * @param fileBase64 - Imagen en formato base64 o buffer
   * @param folder - Carpeta donde guardar (ej: 'firmas')
   * @param publicId - ID público opcional (si no se proporciona, Cloudinary genera uno)
   */
  async uploadSignature(
    fileBase64: string,
    folder: string = 'firmas',
    publicId?: string
  ): Promise<CloudinaryUploadResult> {
    try {
      if (!GLOBAL_ENV.CLOUD_NAME || !GLOBAL_ENV.API_KEY_CLOUDINARY || !GLOBAL_ENV.API_SECRET_CLOUDINARY) {
        throw new ResponseError(500, 'Cloudinary no está configurado correctamente');
      }

      const uploadOptions: any = {
        folder: folder,
        resource_type: 'image',
        format: 'png', // Las firmas generalmente son PNG
        overwrite: false
      };

      if (publicId) {
        uploadOptions.public_id = publicId;
      }

      const result = await cloudinary.uploader.upload(fileBase64, uploadOptions);

      return {
        url: result.url,
        public_id: result.public_id,
        secure_url: result.secure_url
      };
    } catch (error: any) {
      console.error('Error al subir firma a Cloudinary:', error);
      throw new ResponseError(500, `Error al subir firma: ${error.message || 'Error desconocido'}`);
    }
  }

  /**
   * Sube un documento (PDF u otro formato) a Cloudinary
   * @param fileBase64 - Documento en formato base64 o buffer
   * @param folder - Carpeta donde guardar (ej: 'documentos')
   * @param fileName - Nombre del archivo (sin extensión, se agregará .pdf automáticamente)
   */
  async uploadDocument(
    fileBase64: string | Buffer,
    folder: string = 'documentos',
    fileName?: string
  ): Promise<CloudinaryUploadResult> {
    try {
      if (!GLOBAL_ENV.CLOUD_NAME || !GLOBAL_ENV.API_KEY_CLOUDINARY || !GLOBAL_ENV.API_SECRET_CLOUDINARY) {
        throw new ResponseError(500, 'Cloudinary no está configurado correctamente');
      }

      const uploadOptions: any = {
        folder: folder,
        resource_type: 'raw', // Documentos se suben como raw
        overwrite: false
      };

      if (fileName) {
        // Asegurar que el nombre tenga la extensión .pdf para archivos raw
        const fileNameWithExtension = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
        uploadOptions.public_id = fileNameWithExtension;
      }

      // Convertir Buffer a string base64 si es necesario
      let fileData: string;
      if (Buffer.isBuffer(fileBase64)) {
        fileData = `data:application/pdf;base64,${fileBase64.toString('base64')}`;
      } else {
        fileData = fileBase64;
      }

      const result = await cloudinary.uploader.upload(fileData, uploadOptions);

      return {
        url: result.url,
        public_id: result.public_id,
        secure_url: result.secure_url
      };
    } catch (error: any) {
      console.error('Error al subir documento a Cloudinary:', error);
      throw new ResponseError(500, `Error al subir documento: ${error.message || 'Error desconocido'}`);
    }
  }

  /**
   * Elimina un archivo de Cloudinary
   * @param publicId - ID público del archivo a eliminar
   * @param resourceType - Tipo de recurso ('image' o 'raw')
   */
  async deleteFile(publicId: string, resourceType: 'image' | 'raw' = 'image'): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });
    } catch (error: any) {
      console.error('Error al eliminar archivo de Cloudinary:', error);
      throw new ResponseError(500, `Error al eliminar archivo: ${error.message || 'Error desconocido'}`);
    }
  }

  /**
   * Obtiene la URL de un archivo
   * @param publicId - ID público del archivo
   * @param resourceType - Tipo de recurso ('image' o 'raw')
   */
  getUrl(publicId: string, resourceType: 'image' | 'raw' = 'image'): string {
    return cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true
    });
  }
}

export const cloudinaryService = new CloudinaryService();


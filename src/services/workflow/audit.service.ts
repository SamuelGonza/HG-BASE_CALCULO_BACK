import { Types } from 'mongoose';
import { AuditLog } from '@/models/AuditLog.model';

/**
 * Servicio de Auditoría
 * Registra todos los cambios en el sistema para trazabilidad y cumplimiento normativo
 */
export class AuditService {
  /**
   * Registra una acción en el log de auditoría
   * @param entidad - Nombre de la entidad (ej: 'Production', 'Medicine')
   * @param entidadId - ID de la entidad afectada
   * @param accion - Acción realizada (ej: 'CREATE', 'UPDATE', 'DELETE', 'STATE_TRANSITION')
   * @param cambios - Objeto con los cambios realizados
   * @param usuarioId - ID del usuario que realizó la acción
   */
  async logAction(
    entidad: string,
    entidadId: Types.ObjectId,
    accion: string,
    cambios: Record<string, any>,
    usuarioId: Types.ObjectId
  ): Promise<void> {
    try {
      await AuditLog.create({
        entidad,
        entidadId,
        accion,
        cambios,
        usuarioId,
        timestamp: new Date()
      });
    } catch (error) {
      // No lanzar error para no interrumpir el flujo principal
      // Pero registrar en consola para debugging
      console.error('Error al registrar auditoría:', error);
    }
  }

  /**
   * Obtiene el historial de auditoría de una entidad
   */
  async getAuditHistory(
    entidad: string,
    entidadId: Types.ObjectId,
    limit: number = 50
  ) {
    return await AuditLog.find({
      entidad,
      entidadId
    })
      .populate('usuarioId', 'nombre email rol')
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  /**
   * Obtiene todas las acciones de un usuario
   */
  async getUserActions(
    usuarioId: Types.ObjectId,
    limit: number = 50
  ) {
    return await AuditLog.find({
      usuarioId
    })
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  /**
   * Obtiene acciones por tipo de entidad
   */
  async getActionsByEntity(
    entidad: string,
    limit: number = 50
  ) {
    return await AuditLog.find({
      entidad
    })
      .populate('usuarioId', 'nombre email rol')
      .sort({ timestamp: -1 })
      .limit(limit);
  }
}

export const auditService = new AuditService();



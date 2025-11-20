import { Types } from 'mongoose';
import dayjs from 'dayjs';
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
        timestamp: dayjs().toDate()
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

  /**
   * Obtiene la lista de tipos de entidades disponibles en auditoría
   */
  async getAvailableEntities() {
    const entities = await AuditLog.distinct('entidad');
    return entities.sort();
  }

  /**
   * Obtiene la lista de usuarios que han realizado acciones auditables
   */
  async getAvailableUsers() {
    const users = await AuditLog.distinct('usuarioId');
    // Poblar información de usuarios
    const User = require('@/models/User.model').User;
    const usersData = await User.find({ _id: { $in: users } })
      .select('_id username nombre rolSistema')
      .sort({ nombre: 1 });
    return usersData;
  }

  /**
   * Obtiene entidades específicas de un tipo (ej: todas las producciones que tienen auditoría)
   */
  async getEntitiesOfType(entidad: string) {
    const entidadIds = await AuditLog.distinct('entidadId', { entidad });
    
    // Mapear el nombre de entidad al modelo correspondiente
    const modelMap: Record<string, any> = {
      'Production': require('@/models/Production.model').Production,
      'Medicine': require('@/models/Medicine.model').Medicine,
      'Vehicle': require('@/models/Vehicle.model').Vehicle,
      'Container': require('@/models/Container.model').Container,
      'Laboratory': require('@/models/Laboratory.model').Laboratory,
      'Stability': require('@/models/Stability.model').Stability,
      'User': require('@/models/User.model').User,
      'Document': require('@/models/Document.model').Document
    };

    const Model = modelMap[entidad];
    if (!Model) {
      return [];
    }

    // Obtener datos básicos de las entidades
    let entities = await Model.find({ _id: { $in: entidadIds } })
      .select('_id')
      .limit(100)
      .sort({ createdAt: -1 });

    // Agregar campos específicos según el tipo de entidad
    if (entidad === 'Production') {
      entities = await Model.find({ _id: { $in: entidadIds } })
        .select('_id codigo estado lineaProduccion fechaProduccion')
        .limit(100)
        .sort({ createdAt: -1 });
    } else if (entidad === 'Medicine') {
      entities = await Model.find({ _id: { $in: entidadIds } })
        .select('_id nombre concentracion viaAdministracion')
        .limit(100)
        .sort({ nombre: 1 });
    } else if (entidad === 'User') {
      entities = await Model.find({ _id: { $in: entidadIds } })
        .select('_id username nombre rolSistema')
        .limit(100)
        .sort({ nombre: 1 });
    }

    return entities;
  }
}

export const auditService = new AuditService();



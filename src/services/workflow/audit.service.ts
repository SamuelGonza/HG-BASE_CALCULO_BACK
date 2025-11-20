import { Types } from 'mongoose';
import dayjs from 'dayjs';
import { AuditLog } from '@/models/AuditLog.model';
import { Production } from '@/models/Production.model';
import { Medicine } from '@/models/Medicine.model';
import { Vehicle } from '@/models/Vehicle.model';
import { Container } from '@/models/Container.model';
import { Lab } from '@/models/Lab.model';
import { Stability } from '@/models/Stability.model';
import { User } from '@/models/User.model';
import { Document } from '@/models/Document.model';

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
      .populate('usuarioId', 'nombre username email rolSistema')
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
      .populate('usuarioId', 'nombre username email rolSistema')
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  /**
   * Obtiene todas las auditorías con paginación
   */
  async getAllAudits(limit: number = 100, skip: number = 0) {
    const [audits, total] = await Promise.all([
      AuditLog.find({})
        .populate('usuarioId', 'nombre username email rolSistema')
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip),
      AuditLog.countDocuments({})
    ]);

    return {
      audits,
      total
    };
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
    const usersData = await User.find({ _id: { $in: users } })
      .select('_id username nombre rolSistema')
      .sort({ nombre: 1 });
    return usersData;
  }

  /**
   * Obtiene entidades específicas de un tipo (ej: todas las producciones que tienen auditoría)
   */
  async getEntitiesOfType(entidad: string) {
    try {
      const entidadIds = await AuditLog.distinct('entidadId', { entidad });
      
      if (entidadIds.length === 0) {
        return [];
      }

      // Mapear el nombre de entidad al modelo correspondiente
      const modelMap: Record<string, any> = {
        'Production': Production,
        'Medicine': Medicine,
        'Vehicle': Vehicle,
        'Container': Container,
        'Laboratory': Lab,
        'Lab': Lab,
        'Stability': Stability,
        'User': User,
        'Document': Document
      };

      const Model = modelMap[entidad];
      if (!Model) {
        console.warn(`Modelo no encontrado para entidad: ${entidad}`);
        return [];
      }

      // Agregar campos específicos según el tipo de entidad
      let entities: any[] = [];

      if (entidad === 'Production') {
        entities = await Model.find({ _id: { $in: entidadIds } })
          .select('_id codigo estado lineaProduccion fechaProduccion')
          .limit(100)
          .sort({ createdAt: -1 })
          .lean();
      } else if (entidad === 'Medicine') {
        entities = await Model.find({ _id: { $in: entidadIds } })
          .select('_id nombre concentracion viaAdministracion')
          .limit(100)
          .sort({ nombre: 1 })
          .lean();
      } else if (entidad === 'Vehicle') {
        entities = await Model.find({ _id: { $in: entidadIds } })
          .select('_id nombre')
          .limit(100)
          .sort({ nombre: 1 })
          .lean();
      } else if (entidad === 'Container') {
        entities = await Model.find({ _id: { $in: entidadIds } })
          .select('_id tipo nombre')
          .limit(100)
          .sort({ tipo: 1 })
          .lean();
      } else if (entidad === 'Laboratory') {
        entities = await Model.find({ _id: { $in: entidadIds } })
          .select('_id nombre')
          .limit(100)
          .sort({ nombre: 1 })
          .lean();
      } else if (entidad === 'User') {
        entities = await Model.find({ _id: { $in: entidadIds } })
          .select('_id username nombre rolSistema')
          .limit(100)
          .sort({ nombre: 1 })
          .lean();
      } else if (entidad === 'Document') {
        entities = await Model.find({ _id: { $in: entidadIds } })
          .select('_id tipo productionId fileUrl')
          .limit(100)
          .sort({ createdAt: -1 })
          .lean();
      } else if (entidad === 'Stability') {
        entities = await Model.find({ _id: { $in: entidadIds } })
          .select('_id medicamentoId vehiculoId envaseId laboratorioId')
          .limit(100)
          .sort({ createdAt: -1 })
          .lean();
      } else {
        // Para cualquier otra entidad, devolver datos básicos
        entities = await Model.find({ _id: { $in: entidadIds } })
          .select('_id')
          .limit(100)
          .sort({ createdAt: -1 })
          .lean();
      }

      return entities;
    } catch (error) {
      console.error(`Error al obtener entidades de tipo ${entidad}:`, error);
      throw error;
    }
  }
}

export const auditService = new AuditService();



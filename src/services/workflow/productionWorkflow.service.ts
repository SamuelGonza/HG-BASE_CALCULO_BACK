import { Types } from 'mongoose';
import { Production, IProduction, ProductionState } from '@/models/Production.model';
import { UserRole } from '@/models/User.model';
import { ResponseError } from '@/utils/erros';
import { auditService } from './audit.service';

/**
 * Servicio de flujo de trabajo (Workflow) para producciones
 * Controla las transiciones de estado y valida que se cumplan las reglas
 */
export class ProductionWorkflowService {
  /**
   * Estados válidos y sus transiciones permitidas
   */
  private readonly STATE_TRANSITIONS: Record<ProductionState, ProductionState[]> = {
    CREADO: ['VALIDADO'],
    VALIDADO: ['CALCULADO'],
    CALCULADO: ['PROGRAMADO'],
    PROGRAMADO: ['PRODUCIDO'],
    PRODUCIDO: ['QC'],
    QC: ['ETIQUETADO'],
    ETIQUETADO: ['FINALIZADO'],
    FINALIZADO: [] // Estado final, no se puede avanzar
  };

  /**
   * Roles permitidos para cada transición
   */
  private readonly ROLE_PERMISSIONS: Record<ProductionState, UserRole[]> = {
    CREADO: ['AUXILIAR', 'QUIMICO', 'COORDINADOR'],
    VALIDADO: ['QUIMICO', 'COORDINADOR'],
    CALCULADO: ['QUIMICO', 'COORDINADOR'],
    PROGRAMADO: ['COORDINADOR'],
    PRODUCIDO: ['QUIMICO', 'COORDINADOR'],
    QC: ['QUIMICO', 'COORDINADOR'],
    ETIQUETADO: ['AUXILIAR', 'QUIMICO', 'COORDINADOR'],
    FINALIZADO: ['COORDINADOR']
  };

  /**
   * Valida si una transición de estado es permitida
   */
  private validateTransition(
    currentState: ProductionState,
    newState: ProductionState
  ): void {
    const allowedStates = this.STATE_TRANSITIONS[currentState];
    
    if (!allowedStates.includes(newState)) {
      throw new ResponseError(
        400,
        `Transición no permitida: no se puede pasar de ${currentState} a ${newState}`
      );
    }
  }

  /**
   * Valida si el rol del usuario tiene permisos para realizar la transición
   */
  private validateRolePermission(
    state: ProductionState,
    userRole: UserRole
  ): void {
    const allowedRoles = this.ROLE_PERMISSIONS[state];
    
    if (!allowedRoles.includes(userRole)) {
      throw new ResponseError(
        403,
        `El rol ${userRole} no tiene permisos para realizar acciones en el estado ${state}`
      );
    }
  }

  /**
   * Obtiene el siguiente estado válido desde el estado actual
   */
  getNextState(currentState: ProductionState): ProductionState | null {
    const allowedStates = this.STATE_TRANSITIONS[currentState];
    return allowedStates.length > 0 ? allowedStates[0] : null;
  }

  /**
   * Transiciona una producción al siguiente estado
   * Registra quién realizó la transición y actualiza timestamps
   */
  async transitionToState(
    productionId: Types.ObjectId,
    newState: ProductionState,
    userId: Types.ObjectId,
    userRole: UserRole
  ): Promise<IProduction> {
    // Obtener producción
    const production = await Production.findById(productionId);
    if (!production) {
      throw new ResponseError(404, 'Producción no encontrada');
    }

    // Validar transición
    this.validateTransition(production.estado, newState);
    
    // Validar permisos del rol
    this.validateRolePermission(newState, userRole);

    // Preparar actualización
    const updateData: any = {
      estado: newState,
      [`timestamps.${newState.toLowerCase()}`]: new Date()
    };

    // Asignar usuario según el estado
    const stateUserField = `${newState.toLowerCase()}Por`;
    updateData[stateUserField] = userId;

    // Actualizar producción
    const updatedProduction = await Production.findByIdAndUpdate(
      productionId,
      { $set: updateData },
      { new: true }
    ).populate('medicamentoId laboratorioId vehiculoId envaseId creadoPor');

    if (!updatedProduction) {
      throw new ResponseError(500, 'Error al actualizar la producción');
    }

    // Registrar en auditoría
    await auditService.logAction(
      'Production',
      productionId,
      'STATE_TRANSITION',
      {
        estadoAnterior: production.estado,
        estadoNuevo: newState,
        usuarioId: userId.toString()
      },
      userId
    );

    return updatedProduction;
  }

  /**
   * Valida una producción (transición CREADO → VALIDADO)
   */
  async validateProduction(
    productionId: Types.ObjectId,
    userId: Types.ObjectId,
    userRole: UserRole
  ): Promise<IProduction> {
    return await this.transitionToState(
      productionId,
      'VALIDADO',
      userId,
      userRole
    );
  }

  /**
   * Calcula una producción (transición VALIDADO → CALCULADO)
   */
  async calculateProduction(
    productionId: Types.ObjectId,
    userId: Types.ObjectId,
    userRole: UserRole
  ): Promise<IProduction> {
    return await this.transitionToState(
      productionId,
      'CALCULADO',
      userId,
      userRole
    );
  }

  /**
   * Programa una producción (transición CALCULADO → PROGRAMADO)
   */
  async scheduleProduction(
    productionId: Types.ObjectId,
    userId: Types.ObjectId,
    userRole: UserRole
  ): Promise<IProduction> {
    return await this.transitionToState(
      productionId,
      'PROGRAMADO',
      userId,
      userRole
    );
  }

  /**
   * Marca una producción como producida (transición PROGRAMADO → PRODUCIDO)
   */
  async markAsProduced(
    productionId: Types.ObjectId,
    userId: Types.ObjectId,
    userRole: UserRole
  ): Promise<IProduction> {
    return await this.transitionToState(
      productionId,
      'PRODUCIDO',
      userId,
      userRole
    );
  }

  /**
   * Marca una producción como QC aprobado (transición PRODUCIDO → QC)
   */
  async approveQC(
    productionId: Types.ObjectId,
    userId: Types.ObjectId,
    userRole: UserRole
  ): Promise<IProduction> {
    return await this.transitionToState(
      productionId,
      'QC',
      userId,
      userRole
    );
  }

  /**
   * Marca una producción como etiquetada (transición QC → ETIQUETADO)
   */
  async markAsLabeled(
    productionId: Types.ObjectId,
    userId: Types.ObjectId,
    userRole: UserRole
  ): Promise<IProduction> {
    return await this.transitionToState(
      productionId,
      'ETIQUETADO',
      userId,
      userRole
    );
  }

  /**
   * Finaliza una producción (transición ETIQUETADO → FINALIZADO)
   */
  async finalizeProduction(
    productionId: Types.ObjectId,
    userId: Types.ObjectId,
    userRole: UserRole
  ): Promise<IProduction> {
    return await this.transitionToState(
      productionId,
      'FINALIZADO',
      userId,
      userRole
    );
  }
}

export const productionWorkflowService = new ProductionWorkflowService();

